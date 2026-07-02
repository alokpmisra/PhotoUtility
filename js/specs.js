// Photo size specifications: passport/visa standards, print sizes, and a
// custom option. All measurements are in millimeters; pixel dimensions are
// derived from mm + dpi so exports stay physically accurate when printed.
(function (global) {
  const MM_PER_INCH = 25.4;

  function mmToPx(mm, dpi) {
    return Math.round((mm / MM_PER_INCH) * dpi);
  }

  const RAW_SPECS = [
    // --- Passport / Visa photos ---
    {
      id: 'us-passport',
      category: 'Passport & Visa',
      name: 'USA Passport / Visa (2x2 in)',
      widthMm: 50.8,
      heightMm: 50.8,
      dpi: 300,
      headMinMm: 25.4, // 1 in
      headMaxMm: 34.9, // 1 3/8 in
      note: 'Head must be 1"–1 3/8" tall; eye height 1 1/8"–1 3/8" from bottom.',
    },
    {
      id: 'india-passport',
      category: 'Passport & Visa',
      name: 'India Passport (2x2 in)',
      widthMm: 50.8,
      heightMm: 50.8,
      dpi: 300,
      headMinMm: 25.4,
      headMaxMm: 34.9,
    },
    {
      id: 'uk-passport',
      category: 'Passport & Visa',
      name: 'UK Passport (35x45 mm)',
      widthMm: 35,
      heightMm: 45,
      dpi: 300,
      headMinMm: 29,
      headMaxMm: 34,
    },
    {
      id: 'eu-passport',
      category: 'Passport & Visa',
      name: 'EU / Schengen Passport (35x45 mm)',
      widthMm: 35,
      heightMm: 45,
      dpi: 300,
      headMinMm: 32,
      headMaxMm: 36,
    },
    {
      id: 'canada-passport',
      category: 'Passport & Visa',
      name: 'Canada Passport (50x70 mm)',
      widthMm: 50,
      heightMm: 70,
      dpi: 300,
      headMinMm: 31,
      headMaxMm: 36,
    },
    {
      id: 'australia-passport',
      category: 'Passport & Visa',
      name: 'Australia Passport (35x45 mm)',
      widthMm: 35,
      heightMm: 45,
      dpi: 300,
      headMinMm: 32,
      headMaxMm: 36,
    },
    {
      id: 'china-visa',
      category: 'Passport & Visa',
      name: 'China Passport / Visa (33x48 mm)',
      widthMm: 33,
      heightMm: 48,
      dpi: 300,
      headMinMm: 28,
      headMaxMm: 33,
    },
    {
      id: 'schengen-visa',
      category: 'Passport & Visa',
      name: 'Generic Visa (35x45 mm)',
      widthMm: 35,
      heightMm: 45,
      dpi: 300,
    },

    // --- Print sizes ---
    {
      id: 'wallet',
      category: 'Print Sizes',
      name: 'Wallet (2.5x3.5 in)',
      widthMm: 63.5,
      heightMm: 88.9,
      dpi: 300,
    },
    {
      id: '4x6',
      category: 'Print Sizes',
      name: '4x6 in Print',
      widthMm: 101.6,
      heightMm: 152.4,
      dpi: 300,
    },
    {
      id: '5x7',
      category: 'Print Sizes',
      name: '5x7 in Print',
      widthMm: 127,
      heightMm: 177.8,
      dpi: 300,
    },
    {
      id: 'square',
      category: 'Print Sizes',
      name: 'Square (1:1, 1000x1000 px)',
      widthMm: mmFromPx(1000, 96),
      heightMm: mmFromPx(1000, 96),
      dpi: 96,
    },
  ];

  function mmFromPx(px, dpi) {
    return (px / dpi) * MM_PER_INCH;
  }

  RAW_SPECS.forEach((s) => {
    s.widthPx = mmToPx(s.widthMm, s.dpi);
    s.heightPx = mmToPx(s.heightMm, s.dpi);
  });

  global.PhotoSpecs = {
    MM_PER_INCH,
    mmToPx,
    list: RAW_SPECS,
    byId(id) {
      return RAW_SPECS.find((s) => s.id === id);
    },
    custom(widthMm, heightMm, dpi) {
      return {
        id: 'custom',
        category: 'Custom',
        name: 'Custom Size',
        widthMm,
        heightMm,
        dpi,
        widthPx: mmToPx(widthMm, dpi),
        heightPx: mmToPx(heightMm, dpi),
      };
    },
  };
})(window);
