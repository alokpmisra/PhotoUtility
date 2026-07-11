// Background replacement using Google's MediaPipe selfie-segmentation
// model (Apache-2.0), vendored under models/selfie_segmentation/ for fully
// offline use. This is a real ML segmentation pass (not a heuristic), so it
// follows the actual person outline (hair, shoulders, etc.) rather than a
// fixed shape — but like any segmenter it can still show soft edge
// artifacts around wispy hair or motion blur.
(function (global) {
  const MODELS_URL = 'models/selfie_segmentation/';
  let initPromise = null;

  function getSegmenter() {
    if (!initPromise) {
      initPromise = new Promise((resolve, reject) => {
        try {
          const seg = new SelfieSegmentation({ locateFile: (file) => MODELS_URL + file });
          seg.setOptions({ modelSelection: 0 }); // "general" model, matches our square-ish crops
          resolve(seg);
        } catch (err) {
          reject(err);
        }
      });
    }
    return initPromise;
  }

  // Replaces the background of `source` (a canvas or image) with solid
  // white. Returns a new canvas the same size as the source; never
  // mutates the input.
  async function removeBackground(source) {
    const seg = await getSegmenter();
    const width = source.width || source.naturalWidth;
    const height = source.height || source.naturalHeight;

    const results = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Segmentation timed out')), 15000);
      seg.onResults((res) => {
        clearTimeout(timeout);
        resolve(res);
      });
      seg.send({ image: source }).catch((err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // The model outputs the mask at a much lower resolution than our
    // export (its "general" model runs at 256x256). Request high-quality
    // smoothing for the upscale so the edge isn't blocky.
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingQuality = 'high';
    maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);

    // The model is often under-confident on ambiguous regions like hair,
    // leaving them at partial confidence rather than committing — composited
    // straight onto white, that reads as washed-out/translucent instead of
    // solid hair. Push the mask through a steep S-curve so anything that's
    // clearly more foreground than not becomes fully opaque (and anything
    // clearly more background becomes fully transparent), leaving only a
    // narrow genuine boundary undecided. A blur afterward feathers that
    // narrow band into a soft (not jagged) edge without re-introducing the
    // washed-out look across the whole hair region.
    const maskData = maskCtx.getImageData(0, 0, width, height);
    const steepness = 12;
    const midpoint = 0.4; // favors foreground, since under-confidence skews low
    for (let i = 0; i < maskData.data.length; i += 4) {
      const x = maskData.data[i] / 255;
      const y = 1 / (1 + Math.exp(-steepness * (x - midpoint)));
      const v = Math.round(y * 255);
      maskData.data[i] = v;
      maskData.data[i + 1] = v;
      maskData.data[i + 2] = v;
    }
    maskCtx.putImageData(maskData, 0, 0);

    // Feather with a blur, drawn into a fresh canvas rather than back onto
    // itself (same-canvas source/dest blur is unreliable across browsers).
    const feathered = document.createElement('canvas');
    feathered.width = width;
    feathered.height = height;
    const featherCtx = feathered.getContext('2d', { willReadFrequently: true });
    featherCtx.filter = `blur(${Math.max(1, Math.round(Math.min(width, height) * 0.006))}px)`;
    featherCtx.drawImage(maskCanvas, 0, 0);
    featherCtx.filter = 'none';

    // Use the (now curved + feathered) mask's luminance as an alpha
    // channel so edges blend smoothly instead of a harsh binary cutout.
    const finalMaskData = featherCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < finalMaskData.data.length; i += 4) {
      finalMaskData.data[i + 3] = finalMaskData.data[i];
    }
    featherCtx.putImageData(finalMaskData, 0, 0);

    const personCanvas = document.createElement('canvas');
    personCanvas.width = width;
    personCanvas.height = height;
    const personCtx = personCanvas.getContext('2d');
    personCtx.drawImage(source, 0, 0, width, height);
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(feathered, 0, 0);

    const outCanvas = document.createElement('canvas');
    outCanvas.width = width;
    outCanvas.height = height;
    const outCtx = outCanvas.getContext('2d');
    outCtx.fillStyle = '#ffffff';
    outCtx.fillRect(0, 0, width, height);
    outCtx.drawImage(personCanvas, 0, 0);

    return outCanvas;
  }

  global.PhotoBackground = { removeBackground };
})(window);
