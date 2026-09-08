# Russian passport spread recognition

The previous label-based parser mixed the issuing authority with a nearby date/code, and missed faint labels. The new explicit `Паспорт РФ — полный разворот` mode reads ten separate regions: three names, two dates, birthplace, issuing authority, department code and vertical series/number. Regions are relative to a tightly framed upright full two-page spread. Vertical numbers are rotated, text is enlarged, and the red channel suppresses patterned background for dark text. Each region uses a suitable Tesseract segmentation mode.

Choose `Другой документ / страница регистрации` for ID cards, other layouts and registration pages. The Russian mode accepts one full-spread image and rejects incompatible aspect ratios. Photographs with significant background, rotation or perspective need to be straightened/cropped before upload. The source image is unchanged.

Candidate review and separate Save remain required. Citizenship, registration address and PIN are not inferred from the spread. Uncertain names, invalid dates/numbers, or authority text contaminated with dates/codes are left empty. Generic extraction also rejects fragments lacking an authority marker.

Validation: local Tesseract with the Russian model downloaded from the same configured language URL was run on the provided image using the new region extraction/preprocessing. Nine resulting fields (including document type) were compared to the visible source; all matched. The final browser/WASM engine was not run, so this is not a browser end-to-end guarantee. `node test-passport-layout.cjs` covers fictitious data, leading zeros, date validity, mixed authority text and absent fields. No source photo or personal values are included in the repository or tests. No database migration.
