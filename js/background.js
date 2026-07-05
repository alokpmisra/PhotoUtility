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
    // export (its "general" model runs at 256x256), so scaling it up
    // naively produces a blocky, stair-stepped edge. Request high-quality
    // smoothing on the upscale, then feather the result with a blur so the
    // person/background transition is soft rather than jagged — a clean
    // edge is exactly what passport-photo compositing needs.
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    maskCtx.imageSmoothingEnabled = true;
    maskCtx.imageSmoothingQuality = 'high';
    maskCtx.filter = `blur(${Math.max(1, Math.round(Math.min(width, height) * 0.006))}px)`;
    maskCtx.drawImage(results.segmentationMask, 0, 0, width, height);
    maskCtx.filter = 'none';

    // Use the mask's luminance as an alpha channel (white = person) so
    // edges blend smoothly instead of a harsh binary cutout.
    const maskData = maskCtx.getImageData(0, 0, width, height);
    for (let i = 0; i < maskData.data.length; i += 4) {
      maskData.data[i + 3] = maskData.data[i];
    }
    maskCtx.putImageData(maskData, 0, 0);

    const personCanvas = document.createElement('canvas');
    personCanvas.width = width;
    personCanvas.height = height;
    const personCtx = personCanvas.getContext('2d');
    personCtx.drawImage(source, 0, 0, width, height);
    personCtx.globalCompositeOperation = 'destination-in';
    personCtx.drawImage(maskCanvas, 0, 0);

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
