// On-device compliance scan (and best-effort auto-fix) for the exported
// photo. Face detection runs via a small bundled model (face-api.js, MIT
// licensed, weights vendored under /models) entirely client-side — no
// image data ever leaves the device.
//
// What this CAN check reliably: exact pixel dimensions/DPI (we control the
// export, so always pass), background flatness/lightness, exposure, and
// blur/sharpness via plain pixel statistics. These are also the checks
// applyPixelFixes() can actually correct, since they're just pixel-value
// adjustments (levels stretch, unsharp mask).
//
// What this measures via face detection, labeled as an ESTIMATE: head
// height and eye-line position against the official ranges, horizontal
// centering, and head tilt. "Head top" isn't a landmark the model
// provides (hair isn't part of a face landmark set), so head height is
// approximated from the detected face box and eyebrow-to-chin distance —
// it will not be pixel-perfect for every hairstyle. These are framing
// problems, not pixel problems, so fixing them means recropping/rotating
// the source photo (handled by the caller using detectFaceMetrics), not a
// filter on the final export.
//
// What this CANNOT check or fix at all: glasses, neutral expression, eyes
// open, head coverings, photo age, or color accuracy. Those are surfaced
// as manual-verification reminders, never as pass/fail.
(function (global) {
  const MODELS_URL = 'models/';
  let modelsLoadedPromise = null;

  function loadModels() {
    if (!modelsLoadedPromise) {
      modelsLoadedPromise = Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
        faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
      ]);
    }
    return modelsLoadedPromise;
  }

  function avgPoint(points) {
    const x = points.reduce((s, p) => s + p.x, 0) / points.length;
    const y = points.reduce((s, p) => s + p.y, 0) / points.length;
    return { x, y };
  }

  // Runs face detection + landmarks on any drawable source (canvas, image,
  // or video) and reduces the 68 raw points down to the handful of
  // measurements both the compliance scan and the auto-fix crop math need.
  // Returns null if no face was found.
  async function detectFaceMetrics(source) {
    await loadModels();
    let detection;
    try {
      detection = await faceapi
        .detectSingleFace(source, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true);
    } catch (err) {
      return null;
    }
    if (!detection) return null;

    const pts = detection.landmarks.positions;
    const chin = pts[8];
    const eyebrowY = avgPoint(pts.slice(17, 27)).y;
    const leftEye = avgPoint(pts.slice(36, 42));
    const rightEye = avgPoint(pts.slice(42, 48));
    const eyeY = (leftEye.y + rightEye.y) / 2;
    const eyeX = (leftEye.x + rightEye.x) / 2;
    const tiltDeg = (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;

    // Hair isn't a face landmark; estimate head-top from the
    // eyebrow-to-chin distance using a typical hair-margin multiplier.
    const browToChin = chin.y - eyebrowY;
    const headTopY = eyebrowY - browToChin * 0.6;
    const headHeightPx = chin.y - headTopY;

    return { chin, eyebrowY, leftEye, rightEye, eyeX, eyeY, tiltDeg, headHeightPx };
  }

  function computeStats(imageData) {
    const { data, width, height } = imageData;
    // A correctly framed head-and-shoulders passport photo can legitimately
    // have shoulders reaching quite high up the sides or the bottom edge
    // once cropped tight — that's not background, and its position isn't
    // predictable from geometry alone. The top strip is the one region
    // that's reliably background regardless of framing (hair doesn't grow
    // upward), so use that alone as the background proxy.
    const borderMargin = Math.round(height * 0.1);
    let bgSum = 0;
    let bgSumSq = 0;
    let bgCount = 0;
    let allSum = 0;
    let allCount = 0;

    for (let y = 0; y < height; y += 2) {
      for (let x = 0; x < width; x += 2) {
        const i = (y * width + x) * 4;
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        allSum += lum;
        allCount++;
        if (y < borderMargin) {
          bgSum += lum;
          bgSumSq += lum * lum;
          bgCount++;
        }
      }
    }

    const bgMean = bgSum / bgCount;
    const bgVariance = bgSumSq / bgCount - bgMean * bgMean;
    const bgStdDev = Math.sqrt(Math.max(0, bgVariance));
    const overallMean = allSum / allCount;
    return { bgMean, bgStdDev, overallMean };
  }

  function sharpnessScore(canvas) {
    // Downsample for consistent, fast Laplacian-variance blur estimation.
    const targetW = 300;
    const scale = Math.min(1, targetW / canvas.width);
    const w = Math.max(1, Math.round(canvas.width * scale));
    const h = Math.max(1, Math.round(canvas.height * scale));
    const small = document.createElement('canvas');
    small.width = w;
    small.height = h;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(canvas, 0, 0, w, h);
    const data = sctx.getImageData(0, 0, w, h).data;

    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }
    const mean = sum / count;
    return sumSq / count - mean * mean; // variance of the Laplacian response
  }

  function verdict(ok, warn) {
    return ok ? 'pass' : warn ? 'warn' : 'fail';
  }

  const EXPOSURE_OK = (m) => m > 90 && m < 210;
  const EXPOSURE_WARN = (m) => m > 60 && m < 230;
  const BACKGROUND_OK = (mean, std) => mean > 180 && std < 20;
  const BACKGROUND_WARN = (mean, std) => mean > 140 && std < 35;
  const SHARPNESS_OK = (s) => s > 90;
  const SHARPNESS_WARN = (s) => s > 40;

  async function analyze(canvas, spec, options) {
    const items = [];

    items.push({
      label: 'Pixel dimensions & DPI',
      status: 'pass',
      detail: `${spec.widthPx} × ${spec.heightPx}px @ ${spec.dpi} DPI`,
    });

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { bgMean, bgStdDev, overallMean } = computeStats(ctx.getImageData(0, 0, canvas.width, canvas.height));
    if (options && options.backgroundKnownGood) {
      // The caller just replaced the background with solid white via
      // segmentation (not a heuristic), so we know this is correct by
      // construction — re-measuring with the border-sampling proxy below
      // would misfire on a tightly cropped photo where hair legitimately
      // reaches close to the frame edge.
      items.push({
        label: 'Background is plain & light',
        status: 'pass',
        detail: 'Replaced with solid white via on-device segmentation.',
      });
    } else {
      items.push({
        label: 'Background is plain & light',
        status: verdict(BACKGROUND_OK(bgMean, bgStdDev), BACKGROUND_WARN(bgMean, bgStdDev)),
        detail: `avg brightness ${bgMean.toFixed(0)}/255, variation ${bgStdDev.toFixed(1)}`,
      });
    }
    items.push({
      label: 'Exposure / brightness',
      status: verdict(EXPOSURE_OK(overallMean), EXPOSURE_WARN(overallMean)),
      detail: `avg brightness ${overallMean.toFixed(0)}/255`,
    });

    const sharpness = sharpnessScore(canvas);
    items.push({
      label: 'Sharpness (not blurry)',
      status: verdict(SHARPNESS_OK(sharpness), SHARPNESS_WARN(sharpness)),
      detail: `edge-energy score ${sharpness.toFixed(0)}`,
    });

    const metrics = await detectFaceMetrics(canvas);

    if (!metrics) {
      items.push({
        label: 'Face detected',
        status: 'fail',
        detail: 'No face found — retake with even lighting, facing the camera directly.',
      });
    } else {
      items.push({ label: 'Face detected', status: 'pass', detail: '' });

      const headHeightMm = (metrics.headHeightPx / spec.dpi) * 25.4;
      if (spec.headMinMm) {
        const inRange = headHeightMm >= spec.headMinMm && headHeightMm <= spec.headMaxMm;
        const nearRange = headHeightMm >= spec.headMinMm - 3 && headHeightMm <= spec.headMaxMm + 3;
        items.push({
          label: 'Head height (estimated)',
          status: verdict(inRange, nearRange),
          detail: `~${headHeightMm.toFixed(1)}mm, needs ${spec.headMinMm.toFixed(1)}–${spec.headMaxMm.toFixed(1)}mm`,
        });
      }

      const eyeFromBottomPx = spec.heightPx - metrics.eyeY;
      const eyeFromBottomMm = (eyeFromBottomPx / spec.dpi) * 25.4;
      if (spec.id === 'us-passport') {
        const inRange = eyeFromBottomMm >= 28.6 && eyeFromBottomMm <= 34.9;
        const nearRange = eyeFromBottomMm >= 25.6 && eyeFromBottomMm <= 37.9;
        items.push({
          label: 'Eye height from bottom (estimated)',
          status: verdict(inRange, nearRange),
          detail: `~${eyeFromBottomMm.toFixed(1)}mm, needs 28.6–34.9mm (1 1/8"–1 3/8")`,
        });
      } else {
        items.push({
          label: 'Eye height from bottom',
          status: 'pass',
          detail: `~${eyeFromBottomMm.toFixed(1)}mm (informational, no fixed rule for this spec)`,
        });
      }

      const centerDeviation = Math.abs(metrics.eyeX - spec.widthPx / 2) / spec.widthPx;
      items.push({
        label: 'Head centered horizontally',
        status: verdict(centerDeviation < 0.04, centerDeviation < 0.08),
        detail: `${(centerDeviation * 100).toFixed(1)}% off-center`,
      });

      items.push({
        label: 'Head not tilted',
        status: verdict(Math.abs(metrics.tiltDeg) < 4, Math.abs(metrics.tiltDeg) < 8),
        detail: `${metrics.tiltDeg.toFixed(1)}° tilt`,
      });
    }

    const manualChecks = [
      'No glasses (removed unless medically required)',
      'Neutral expression or natural smile, both eyes open',
      'No hat or head covering (unless worn daily for religious reasons)',
      'Plain color photo, taken within the last 6 months',
    ];

    const overall = items.some((i) => i.status === 'fail')
      ? 'fail'
      : items.some((i) => i.status === 'warn')
      ? 'warn'
      : 'pass';

    return { items, manualChecks, overall };
  }

  // Percentile-based levels stretch: pushes the darkest ~1% of pixels to
  // black and the lightest ~1% to white, which both corrects poor exposure
  // and flattens/lightens a dim or slightly patterned background.
  function autoLevels(imageData) {
    const data = imageData.data;
    const hist = new Uint32Array(256);
    for (let i = 0; i < data.length; i += 4) {
      const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      hist[lum]++;
    }
    const total = data.length / 4;
    const lowThresh = total * 0.01;
    const highThresh = total * 0.01;

    let cum = 0;
    let lowP = 0;
    for (let v = 0; v < 256; v++) {
      cum += hist[v];
      if (cum >= lowThresh) {
        lowP = v;
        break;
      }
    }
    cum = 0;
    let highP = 255;
    for (let v = 255; v >= 0; v--) {
      cum += hist[v];
      if (cum >= highThresh) {
        highP = v;
        break;
      }
    }
    if (highP <= lowP) {
      lowP = 0;
      highP = 255;
    }
    const range = highP - lowP;

    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        data[i + c] = Math.max(0, Math.min(255, ((data[i + c] - lowP) / range) * 255));
      }
    }
  }

  // Mild unsharp mask: subtracts a slightly blurred copy from the original
  // and adds the difference back in, which improves the appearance of
  // slight softness. It cannot recover genuine motion blur or an
  // out-of-focus shot — those need a retake.
  function unsharpMask(canvas) {
    const { width, height } = canvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const blurredCanvas = document.createElement('canvas');
    blurredCanvas.width = width;
    blurredCanvas.height = height;
    const bctx = blurredCanvas.getContext('2d');
    bctx.filter = 'blur(1.2px)';
    bctx.drawImage(canvas, 0, 0);

    const orig = ctx.getImageData(0, 0, width, height);
    const blurred = bctx.getImageData(0, 0, width, height);
    const amount = 0.6;
    for (let i = 0; i < orig.data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const sharpened = orig.data[i + c] + amount * (orig.data[i + c] - blurred.data[i + c]);
        orig.data[i + c] = Math.max(0, Math.min(255, sharpened));
      }
    }
    ctx.putImageData(orig, 0, 0);
  }

  // Applies whichever pixel-level fixes are needed in place on `canvas`,
  // based on the same thresholds analyze() uses, so it never "fixes"
  // something that already passed. Returns a list of human-readable
  // messages describing what changed (empty if nothing needed fixing).
  function applyPixelFixes(canvas) {
    const messages = [];
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;

    let imageData = ctx.getImageData(0, 0, width, height);
    const { bgMean, bgStdDev, overallMean } = computeStats(imageData);

    if (!EXPOSURE_OK(overallMean) || !BACKGROUND_OK(bgMean, bgStdDev)) {
      autoLevels(imageData);
      ctx.putImageData(imageData, 0, 0);
      messages.push('Adjusted brightness and contrast.');
    }

    const sharpness = sharpnessScore(canvas);
    if (!SHARPNESS_OK(sharpness)) {
      unsharpMask(canvas);
      messages.push('Applied sharpening.');
    }

    return messages;
  }

  // Cheap check so callers (the background-removal model is a heavy,
  // ~6MB one-time load) can skip running it when the background already
  // passes.
  function needsBackgroundFix(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { bgMean, bgStdDev } = computeStats(ctx.getImageData(0, 0, canvas.width, canvas.height));
    return !BACKGROUND_OK(bgMean, bgStdDev);
  }

  global.PhotoCompliance = { analyze, loadModels, detectFaceMetrics, applyPixelFixes, needsBackgroundFix };
})(window);
