(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const screens = {
    start: $('screen-start'),
    camera: $('screen-camera'),
    crop: $('screen-crop'),
    export: $('screen-export'),
  };

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ---------------------------------------------------------------------
  // App state
  // ---------------------------------------------------------------------
  const state = {
    sourceImage: null, // HTMLImageElement of the loaded/captured photo
    spec: null, // currently selected PhotoSpecs entry
    zoom: 1,
    panX: 0,
    panY: 0,
    baseScale: 1,
    canvasW: 0,
    canvasH: 0,
    stream: null,
    facingMode: 'user',
    exportCanvas: null,
    backgroundReplaced: false,
  };

  // ---------------------------------------------------------------------
  // Step 1: Start screen — camera & file upload entry points
  // ---------------------------------------------------------------------
  const fileInput = $('file-input');

  $('btn-open-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await loadImageFromFile(file);
    fileInput.value = '';
  });

  function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        state.sourceImage = img;
        enterCropScreen();
        resolve();
      };
      img.onerror = reject;
      img.src = url;
    });
  }

  // ---------------------------------------------------------------------
  // Step 2: Camera capture
  // ---------------------------------------------------------------------
  const video = $('camera-video');

  $('btn-open-camera').addEventListener('click', openCamera);
  $('btn-camera-cancel').addEventListener('click', closeCamera);
  $('btn-camera-switch').addEventListener('click', () => {
    state.facingMode = state.facingMode === 'user' ? 'environment' : 'user';
    openCamera();
  });
  $('btn-camera-capture').addEventListener('click', capturePhoto);

  async function openCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Camera access is not supported in this browser. Please use "Upload Photo" instead.');
      return;
    }
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: state.facingMode },
        audio: false,
      });
      state.stream = stream;
      video.srcObject = stream;
      video.classList.toggle('mirrored', state.facingMode === 'user');
      showScreen('camera');
    } catch (err) {
      alert('Could not access the camera: ' + err.message);
    }
  }

  function stopStream() {
    if (state.stream) {
      state.stream.getTracks().forEach((t) => t.stop());
      state.stream = null;
    }
  }

  function closeCamera() {
    stopStream();
    showScreen('start');
  }

  function capturePhoto() {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    // Mirror front-facing camera captures so the export matches what the
    // user saw in the live preview (video element is CSS-mirrored).
    if (state.facingMode === 'user') {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    const img = new Image();
    img.onload = () => {
      state.sourceImage = img;
      stopStream();
      enterCropScreen();
    };
    img.src = canvas.toDataURL('image/jpeg', 0.95);
  }

  // ---------------------------------------------------------------------
  // Step 3: Crop screen
  // ---------------------------------------------------------------------
  const specSelect = $('spec-select');
  const cropCanvas = $('crop-canvas');
  const cropCtx = cropCanvas.getContext('2d');
  const zoomRange = $('zoom-range');
  const headGuide = $('head-guide');
  const specInfo = $('spec-info');
  const customFields = $('custom-size-fields');
  const customWidth = $('custom-width');
  const customHeight = $('custom-height');
  const customUnit = $('custom-unit');
  const customDpi = $('custom-dpi');

  function populateSpecSelect() {
    const categories = {};
    PhotoSpecs.list.forEach((s) => {
      (categories[s.category] = categories[s.category] || []).push(s);
    });
    Object.keys(categories).forEach((cat) => {
      const group = document.createElement('optgroup');
      group.label = cat;
      categories[cat].forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        group.appendChild(opt);
      });
      specSelect.appendChild(group);
    });
    const customOpt = document.createElement('option');
    customOpt.value = 'custom';
    customOpt.textContent = 'Custom Size…';
    const customGroup = document.createElement('optgroup');
    customGroup.label = 'Custom';
    customGroup.appendChild(customOpt);
    specSelect.appendChild(customGroup);
  }
  populateSpecSelect();

  function currentCustomSpec() {
    let w = parseFloat(customWidth.value) || 1;
    let h = parseFloat(customHeight.value) || 1;
    const dpi = parseFloat(customDpi.value) || 300;
    const unit = customUnit.value;
    if (unit === 'in') {
      w *= PhotoSpecs.MM_PER_INCH;
      h *= PhotoSpecs.MM_PER_INCH;
    } else if (unit === 'px') {
      w = (w / dpi) * PhotoSpecs.MM_PER_INCH;
      h = (h / dpi) * PhotoSpecs.MM_PER_INCH;
    }
    return PhotoSpecs.custom(w, h, dpi);
  }

  function applySelectedSpec() {
    if (specSelect.value === 'custom') {
      customFields.hidden = false;
      state.spec = currentCustomSpec();
    } else {
      customFields.hidden = true;
      state.spec = PhotoSpecs.byId(specSelect.value);
    }
    updateSpecInfo();
    layoutCropCanvas();
  }

  function updateSpecInfo() {
    const s = state.spec;
    const inW = (s.widthMm / PhotoSpecs.MM_PER_INCH).toFixed(2);
    const inH = (s.heightMm / PhotoSpecs.MM_PER_INCH).toFixed(2);
    let text = `${s.widthMm.toFixed(1)} × ${s.heightMm.toFixed(1)} mm (${inW}" × ${inH}") — ${s.widthPx} × ${s.heightPx}px @ ${s.dpi} DPI`;
    if (s.note) text += `. ${s.note}`;
    specInfo.textContent = text;
    headGuide.hidden = !s.headMinMm;
  }

  specSelect.addEventListener('change', applySelectedSpec);
  [customWidth, customHeight, customUnit, customDpi].forEach((el) =>
    el.addEventListener('input', () => {
      if (specSelect.value === 'custom') applySelectedSpec();
    })
  );

  function enterCropScreen() {
    if (!specSelect.value) specSelect.value = 'us-passport';
    applySelectedSpec();
    showScreen('crop');
    // Layout after the screen becomes visible so container width is correct.
    requestAnimationFrame(layoutCropCanvas);
  }

  function layoutCropCanvas() {
    const s = state.spec;
    if (!s || !state.sourceImage) return;
    const wrap = cropCanvas.parentElement;
    const maxW = Math.min(wrap.clientWidth || 360, 480);
    const ratio = s.widthPx / s.heightPx;
    let cw = maxW;
    let ch = cw / ratio;
    const maxH = window.innerHeight * 0.48;
    if (ch > maxH) {
      ch = maxH;
      cw = ch * ratio;
    }
    state.canvasW = cw;
    state.canvasH = ch;

    const dpr = window.devicePixelRatio || 1;
    cropCanvas.style.width = cw + 'px';
    cropCanvas.style.height = ch + 'px';
    cropCanvas.width = Math.round(cw * dpr);
    cropCanvas.height = Math.round(ch * dpr);
    cropCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const img = state.sourceImage;
    state.baseScale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    state.zoom = 1;
    zoomRange.value = 1;
    centerImage();
    positionHeadGuide();
    drawCrop();
  }

  function centerImage() {
    const img = state.sourceImage;
    const s = state.baseScale * state.zoom;
    state.panX = (state.canvasW - img.naturalWidth * s) / 2;
    state.panY = (state.canvasH - img.naturalHeight * s) / 2;
  }

  function clampPan() {
    const img = state.sourceImage;
    const s = state.baseScale * state.zoom;
    const drawW = img.naturalWidth * s;
    const drawH = img.naturalHeight * s;
    state.panX = Math.min(0, Math.max(state.canvasW - drawW, state.panX));
    state.panY = Math.min(0, Math.max(state.canvasH - drawH, state.panY));
  }

  function drawCrop() {
    const img = state.sourceImage;
    if (!img) return;
    const s = state.baseScale * state.zoom;
    cropCtx.clearRect(0, 0, state.canvasW, state.canvasH);
    cropCtx.drawImage(img, state.panX, state.panY, img.naturalWidth * s, img.naturalHeight * s);
  }

  function positionHeadGuide() {
    const spec = state.spec;
    if (!spec.headMinMm) return;
    // Approximate, standard passport composition guide (not a hard rule):
    // an oval spanning ~62% of the frame width, positioned in the upper
    // two-thirds where the head/chin typically falls.
    headGuide.style.width = state.canvasW * 0.62 + 'px';
    headGuide.style.height = state.canvasH * 0.7 + 'px';
    headGuide.style.left = state.canvasW * 0.19 + 'px';
    headGuide.style.top = state.canvasH * 0.06 + 'px';
  }

  // --- Pan (drag) & zoom (wheel / pinch) via Pointer Events ---
  const pointers = new Map();
  let dragLast = null;
  let pinchStartDist = null;
  let pinchStartZoom = 1;

  cropCanvas.addEventListener('pointerdown', (e) => {
    cropCanvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) {
      dragLast = { x: e.clientX, y: e.clientY };
    } else if (pointers.size === 2) {
      pinchStartDist = pointerDistance();
      pinchStartZoom = state.zoom;
    }
  });

  cropCanvas.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 2) {
      const dist = pointerDistance();
      if (pinchStartDist) {
        const newZoom = clamp(pinchStartZoom * (dist / pinchStartDist), 1, 4);
        setZoom(newZoom);
      }
    } else if (pointers.size === 1 && dragLast) {
      const dx = e.clientX - dragLast.x;
      const dy = e.clientY - dragLast.y;
      dragLast = { x: e.clientX, y: e.clientY };
      state.panX += dx;
      state.panY += dy;
      clampPan();
      drawCrop();
    }
  });

  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDist = null;
    if (pointers.size === 0) dragLast = null;
  }
  cropCanvas.addEventListener('pointerup', endPointer);
  cropCanvas.addEventListener('pointercancel', endPointer);
  cropCanvas.addEventListener('pointerleave', endPointer);

  cropCanvas.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.0015;
      setZoom(clamp(state.zoom + delta, 1, 4));
    },
    { passive: false }
  );

  function pointerDistance() {
    const pts = Array.from(pointers.values());
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  function setZoom(z) {
    const img = state.sourceImage;
    const prevS = state.baseScale * state.zoom;
    const cx = state.canvasW / 2;
    const cy = state.canvasH / 2;
    // Keep the canvas center fixed on the same image point while zooming.
    const imgX = (cx - state.panX) / prevS;
    const imgY = (cy - state.panY) / prevS;
    state.zoom = z;
    const newS = state.baseScale * state.zoom;
    state.panX = cx - imgX * newS;
    state.panY = cy - imgY * newS;
    clampPan();
    zoomRange.value = z;
    drawCrop();
  }

  zoomRange.addEventListener('input', () => setZoom(parseFloat(zoomRange.value)));

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  window.addEventListener('resize', () => {
    if (screens.crop.classList.contains('active')) layoutCropCanvas();
  });

  $('btn-crop-back').addEventListener('click', () => showScreen('start'));
  $('btn-crop-next').addEventListener('click', () => renderExport());

  // ---------------------------------------------------------------------
  // Step 4: Export screen
  // ---------------------------------------------------------------------
  const exportCanvas = $('export-canvas');
  const exportInfo = $('export-info');
  const formatSelect = $('format-select');
  const qualityField = $('quality-field');
  const qualityRange = $('quality-range');
  const sheetSelect = $('sheet-select');
  const complianceStatus = $('compliance-status');
  const complianceList = $('compliance-list');
  const complianceManualList = $('compliance-manual-list');
  const autofixButton = $('btn-autofix');
  const autofixStatus = $('autofix-status');

  function renderExport(skipComplianceCheck) {
    const s = state.spec;
    const img = state.sourceImage;
    const k = s.widthPx / state.canvasW; // CSS-px -> export-px scale factor

    state.backgroundReplaced = false; // a fresh render from source always undoes any prior background fix
    exportCanvas.width = s.widthPx;
    exportCanvas.height = s.heightPx;
    const ctx = exportCanvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, s.widthPx, s.heightPx);

    const drawScale = state.baseScale * state.zoom * k;
    ctx.drawImage(
      img,
      state.panX * k,
      state.panY * k,
      img.naturalWidth * drawScale,
      img.naturalHeight * drawScale
    );

    state.exportCanvas = exportCanvas;
    exportInfo.textContent = `${s.name} — ${s.widthPx} × ${s.heightPx}px @ ${s.dpi} DPI`;
    showScreen('export');
    if (!skipComplianceCheck) runComplianceCheck();
  }

  const STATUS_ICON = { pass: '✅', warn: '⚠️', fail: '❌' };

  function runComplianceCheck() {
    complianceStatus.textContent = 'Scanning photo…';
    complianceList.innerHTML = '';
    complianceManualList.innerHTML = '';

    return PhotoCompliance.analyze(state.exportCanvas, state.spec, { backgroundKnownGood: state.backgroundReplaced })
      .then((result) => {
        complianceStatus.textContent =
          result.overall === 'pass'
            ? '✅ Looks good — all automated checks passed.'
            : result.overall === 'warn'
            ? '⚠️ Some checks are borderline — review before submitting.'
            : '❌ One or more checks failed — consider retaking the photo.';

        result.items.forEach((item) => {
          const li = document.createElement('li');
          li.className = 'compliance-item compliance-' + item.status;
          li.innerHTML =
            `<span class="compliance-icon">${STATUS_ICON[item.status]}</span>` +
            `<span class="compliance-text"><strong>${item.label}</strong>${item.detail ? ' — ' + item.detail : ''}</span>`;
          complianceList.appendChild(li);
        });

        result.manualChecks.forEach((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          complianceManualList.appendChild(li);
        });
      })
      .catch(() => {
        complianceStatus.textContent = 'Could not run the compliance scan on this device/browser.';
      });
  }

  // Bakes a rotation into a fresh copy of the source photo (white-filled
  // corners, since ID photo backgrounds are light anyway) so the rest of
  // the crop/export pipeline can keep treating it as a normal axis-aligned
  // image — no need to make the interactive cropper rotation-aware.
  function rotateImage(img, angleDeg) {
    return new Promise((resolve) => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((angleDeg * Math.PI) / 180);
      ctx.translate(-w / 2, -h / 2);
      ctx.drawImage(img, 0, 0, w, h);
      const rotated = new Image();
      rotated.onload = () => resolve(rotated);
      rotated.src = canvas.toDataURL('image/jpeg', 0.95);
    });
  }

  function rotatePoint(x, y, cx, cy, angleDeg) {
    const theta = (angleDeg * Math.PI) / 180;
    const dx = x - cx;
    const dy = y - cy;
    return {
      x: cx + dx * Math.cos(theta) - dy * Math.sin(theta),
      y: cy + dx * Math.sin(theta) + dy * Math.cos(theta),
    };
  }

  async function autoFixPhoto() {
    autofixButton.disabled = true;
    autofixStatus.textContent = 'Analyzing photo…';
    const messages = [];

    try {
      const metrics = await PhotoCompliance.detectFaceMetrics(state.sourceImage);

      if (!metrics) {
        messages.push('No face detected — could not auto-fix framing. Retake with even lighting, facing the camera directly.');
      } else {
        let eyeX = metrics.eyeX;
        let eyeY = metrics.eyeY;
        let headHeightPx = metrics.headHeightPx;

        if (Math.abs(metrics.tiltDeg) >= 1) {
          const cx = state.sourceImage.naturalWidth / 2;
          const cy = state.sourceImage.naturalHeight / 2;
          const angle = -metrics.tiltDeg;
          state.sourceImage = await rotateImage(state.sourceImage, angle);

          const rEye = rotatePoint(metrics.eyeX, metrics.eyeY, cx, cy, angle);
          const rChin = rotatePoint(metrics.chin.x, metrics.chin.y, cx, cy, angle);
          // Eyebrow x isn't tracked separately, so reuse eye x as a stand-in
          // (they're close horizontally) purely to get the rotated eyebrow
          // y-coordinate — good enough given the head-height estimate below
          // is already an approximation.
          const rBrow = rotatePoint(metrics.eyeX, metrics.eyebrowY, cx, cy, angle);
          eyeX = rEye.x;
          eyeY = rEye.y;
          const rBrowToChin = rChin.y - rBrow.y;
          headHeightPx = rChin.y - (rBrow.y - rBrowToChin * 0.6);
          messages.push(`Rotated ${Math.abs(metrics.tiltDeg).toFixed(1)}° to level the eyes.`);
        }

        const spec = state.spec;
        if (spec.headMinMm) {
          const targetHeadHeightMm = (spec.headMinMm + spec.headMaxMm) / 2;
          const targetHeadHeightCss = state.canvasH * (targetHeadHeightMm / spec.heightMm);
          const idealZoom = targetHeadHeightCss / headHeightPx / state.baseScale;
          const clampedZoom = clamp(idealZoom, 1, 4);
          if (Math.abs(clampedZoom - idealZoom) > 0.01) {
            messages.push(
              idealZoom < 1
                ? 'Head is larger than the target size even at the widest crop — for a perfect fit, retake from a bit farther away.'
                : 'Head is smaller than the target size even at maximum zoom — for a perfect fit, retake a bit closer.'
            );
          }
          state.zoom = clampedZoom;
          zoomRange.value = clampedZoom;
          const sFinal = state.baseScale * clampedZoom;

          const targetEyeYCss =
            spec.id === 'us-passport'
              ? state.canvasH - (31.75 / spec.heightMm) * state.canvasH // midpoint of 28.6-34.9mm
              : state.canvasH * 0.45;

          state.panX = state.canvasW / 2 - eyeX * sFinal;
          state.panY = targetEyeYCss - eyeY * sFinal;
          clampPan();
          drawCrop();
          messages.push('Reframed to match target head size and eye position.');
        } else {
          messages.push('This size has no defined head-height rule, so framing was left as-is.');
        }
      }
    } catch (err) {
      messages.push('Could not analyze the photo for auto-fix.');
    }

    renderExport(true);

    if (PhotoCompliance.needsBackgroundFix(state.exportCanvas)) {
      autofixStatus.textContent = messages.concat('Removing background…').join(' ');
      try {
        const bgFixed = await PhotoBackground.removeBackground(state.exportCanvas);
        const exportCtx = state.exportCanvas.getContext('2d');
        exportCtx.clearRect(0, 0, state.exportCanvas.width, state.exportCanvas.height);
        exportCtx.drawImage(bgFixed, 0, 0);
        state.backgroundReplaced = true;
        messages.push('Replaced background with white.');
      } catch (err) {
        messages.push('Could not remove the background on this device/browser.');
      }
    }

    const pixelMessages = PhotoCompliance.applyPixelFixes(state.exportCanvas);
    messages.push(...pixelMessages);
    await runComplianceCheck();

    if (!messages.length) messages.push('No issues found to fix.');
    autofixStatus.textContent = messages.join(' ');
    autofixButton.disabled = false;
  }

  autofixButton.addEventListener('click', autoFixPhoto);

  formatSelect.addEventListener('change', () => {
    qualityField.hidden = formatSelect.value === 'image/png';
  });
  qualityField.hidden = formatSelect.value === 'image/png';

  $('btn-export-back').addEventListener('click', () => showScreen('crop'));
  $('btn-start-over').addEventListener('click', () => {
    state.sourceImage = null;
    showScreen('start');
  });

  function extForMime(mime) {
    return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[mime] || 'jpg';
  }

  function saveBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  $('btn-download').addEventListener('click', () => {
    const mime = formatSelect.value;
    const quality = mime === 'image/png' ? undefined : parseFloat(qualityRange.value);
    exportCanvas.toBlob(
      (blob) => {
        const s = state.spec;
        saveBlob(blob, `${s.id}-${s.widthPx}x${s.heightPx}.${extForMime(mime)}`);
      },
      mime,
      quality
    );
  });

  // --- Print sheet: tile copies of the exported photo onto a page ---
  const SHEETS = {
    '4x6': { widthMm: 101.6, heightMm: 152.4 },
    '5x7': { widthMm: 127, heightMm: 177.8 },
    a4: { widthMm: 210, heightMm: 297 },
  };

  $('btn-download-sheet').addEventListener('click', () => {
    const s = state.spec;
    const sheet = SHEETS[sheetSelect.value];
    const dpi = s.dpi;
    const sheetWpx = PhotoSpecs.mmToPx(sheet.widthMm, dpi);
    const sheetHpx = PhotoSpecs.mmToPx(sheet.heightMm, dpi);
    const marginPx = PhotoSpecs.mmToPx(4, dpi);
    const gutterPx = PhotoSpecs.mmToPx(2, dpi);

    const photoW = s.widthPx;
    const photoH = s.heightPx;
    const cols = Math.max(1, Math.floor((sheetWpx - 2 * marginPx + gutterPx) / (photoW + gutterPx)));
    const rows = Math.max(1, Math.floor((sheetHpx - 2 * marginPx + gutterPx) / (photoH + gutterPx)));

    const work = document.createElement('canvas');
    work.width = sheetWpx;
    work.height = sheetHpx;
    const ctx = work.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, sheetWpx, sheetHpx);

    const gridW = cols * photoW + (cols - 1) * gutterPx;
    const gridH = rows * photoH + (rows - 1) * gutterPx;
    const startX = (sheetWpx - gridW) / 2;
    const startY = (sheetHpx - gridH) / 2;

    ctx.strokeStyle = '#bbbbbb';
    ctx.lineWidth = Math.max(1, dpi / 300);
    ctx.setLineDash([dpi / 60, dpi / 60]);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = startX + c * (photoW + gutterPx);
        const y = startY + r * (photoH + gutterPx);
        ctx.drawImage(state.exportCanvas, x, y, photoW, photoH);
        ctx.strokeRect(x + 0.5, y + 0.5, photoW - 1, photoH - 1);
      }
    }

    work.toBlob(
      (blob) => saveBlob(blob, `print-sheet-${sheetSelect.value}-${s.id}.jpg`),
      'image/jpeg',
      0.95
    );
  });

  // ---------------------------------------------------------------------
  // Service worker registration (PWA offline support)
  // ---------------------------------------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        /* offline support is best-effort; ignore registration failures */
      });
    });
  }
})();
