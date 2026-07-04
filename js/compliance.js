// On-device compliance scan for the exported photo. Runs a small bundled
// face-detection model (face-api.js, MIT licensed, weights vendored under
// /models) entirely client-side — no image data ever leaves the device.
//
// What this CAN check reliably: exact pixel dimensions/DPI (we control the
// export, so always pass), background flatness/lightness, exposure, and
// blur/sharpness via plain pixel statistics.
//
// What this measures via face detection, labeled as an ESTIMATE: head
// height and eye-line position against the official ranges, horizontal
// centering, and head tilt. "Head top" isn't a landmark the model
// provides (hair isn't part of a face landmark set), so head height is
// approximated from the detected face box and eyebrow-to-chin distance —
// it will not be pixel-perfect for every hairstyle.
//
// What this CANNOT check at all: glasses, neutral expression, eyes open,
// head coverings, photo age, or color accuracy. Those are surfaced as
// manual-verification reminders, never as pass/fail.
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

  function imageStats(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const { width, height } = canvas;
    const data = ctx.getImageData(0, 0, width, height).data;

    // Sample a border ring (outer 8%) as a proxy for the background, and
    // compute overall luminance for exposure, in one pass.
    const borderMargin = Math.round(Math.min(width, height) * 0.08);
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
        const inBorder = x < borderMargin || x > width - borderMargin || y < borderMargin || y > height - borderMargin;
        if (inBorder) {
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
        const lap =
          4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
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

  async function analyze(canvas, spec) {
    const items = [];

    items.push({
      label: 'Pixel dimensions & DPI',
      status: 'pass',
      detail: `${spec.widthPx} × ${spec.heightPx}px @ ${spec.dpi} DPI`,
    });

    const { bgMean, bgStdDev, overallMean } = imageStats(canvas);
    items.push({
      label: 'Background is plain & light',
      status: verdict(bgMean > 180 && bgStdDev < 20, bgMean > 140 && bgStdDev < 35),
      detail: `avg brightness ${bgMean.toFixed(0)}/255, variation ${bgStdDev.toFixed(1)}`,
    });
    items.push({
      label: 'Exposure / brightness',
      status: verdict(overallMean > 90 && overallMean < 210, overallMean > 60 && overallMean < 230),
      detail: `avg brightness ${overallMean.toFixed(0)}/255`,
    });

    const sharpness = sharpnessScore(canvas);
    items.push({
      label: 'Sharpness (not blurry)',
      status: verdict(sharpness > 90, sharpness > 40),
      detail: `edge-energy score ${sharpness.toFixed(0)}`,
    });

    let detection = null;
    try {
      await loadModels();
      detection = await faceapi
        .detectSingleFace(canvas, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true);
    } catch (err) {
      detection = null;
    }

    if (!detection) {
      items.push({
        label: 'Face detected',
        status: 'fail',
        detail: 'No face found — retake with even lighting, facing the camera directly.',
      });
    } else {
      items.push({ label: 'Face detected', status: 'pass', detail: '' });

      const pts = detection.landmarks.positions;
      const chin = pts[8];
      const eyebrowY = avgPoint(pts.slice(17, 27)).y;
      const leftEye = avgPoint(pts.slice(36, 42));
      const rightEye = avgPoint(pts.slice(42, 48));
      const eyeY = (leftEye.y + rightEye.y) / 2;
      const eyeX = (leftEye.x + rightEye.x) / 2;

      // Hair isn't a face landmark; estimate head-top from the
      // eyebrow-to-chin distance using a typical hair-margin multiplier.
      const browToChin = chin.y - eyebrowY;
      const estimatedHeadTop = eyebrowY - browToChin * 0.6;
      const headHeightPx = chin.y - estimatedHeadTop;
      const headHeightMm = (headHeightPx / spec.dpi) * 25.4;

      if (spec.headMinMm) {
        const inRange = headHeightMm >= spec.headMinMm && headHeightMm <= spec.headMaxMm;
        const nearRange =
          headHeightMm >= spec.headMinMm - 3 && headHeightMm <= spec.headMaxMm + 3;
        items.push({
          label: 'Head height (estimated)',
          status: verdict(inRange, nearRange),
          detail: `~${headHeightMm.toFixed(1)}mm, needs ${spec.headMinMm.toFixed(1)}–${spec.headMaxMm.toFixed(1)}mm`,
        });
      }

      const eyeFromBottomPx = spec.heightPx - eyeY;
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

      const centerDeviation = Math.abs(eyeX - spec.widthPx / 2) / spec.widthPx;
      items.push({
        label: 'Head centered horizontally',
        status: verdict(centerDeviation < 0.04, centerDeviation < 0.08),
        detail: `${(centerDeviation * 100).toFixed(1)}% off-center`,
      });

      const tiltDeg = (Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * 180) / Math.PI;
      items.push({
        label: 'Head not tilted',
        status: verdict(Math.abs(tiltDeg) < 4, Math.abs(tiltDeg) < 8),
        detail: `${tiltDeg.toFixed(1)}° tilt`,
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

  global.PhotoCompliance = { analyze, loadModels };
})(window);
