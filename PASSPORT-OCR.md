# Seller passport photo recognition

The seller form has a «Загрузить паспорт» button. Select up to four JPG/PNG/WebP photos, at most 12 MB each. The browser runs Tesseract.js 6.0.1 with Russian and English models; scripts and language models download from the library's CDNs, but image bytes are not uploaded by this feature. No API key, server OCR endpoint, schema migration or new database permission is needed.

Recognition is followed by a review dialog with source thumbnails, extracted text, editable candidate fields and per-field selection. Existing nonempty, differing seller values are not selected for replacement by default. Only checked, nonempty values transfer to the seller form; normal Save commits them. Closing cancels processing and releases preview URLs. This feature does not attach the source passport to Storage automatically.

The parser uses printed Russian/English labels, Russian passport series/number patterns and ID-number patterns. It does not guess unknown dates or perform transliteration/MRZ interpretation. Partial or uncertain extraction requires manual completion. PDF/HEIC must first be exported to JPG/PNG. Use upright, clearly readable photos; first use requires downloading OCR models and may take a minute.

Run `node test-passport.cjs` for field extraction checks: Cyrillic/English labels, dates, leading zeros, ID/PIN and missing values. No real passport data is present in tests. API reference: https://github.com/naptha/tesseract.js/blob/master/docs/api.md
