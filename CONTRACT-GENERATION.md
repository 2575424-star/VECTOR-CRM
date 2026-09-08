# Contract generation

Run `setup-contract-details.sql` before deploying. It adds a JSON object to each car for contract-specific fields and grants column access in the existing test access model. An UPDATE policy on cars must already exist (installed during the preceding seller/buyer fix).

The card offers a Word-generation dialog after seller/buyer data are saved. It collects contract and appendix dates, contract number, city, full vehicle name/VIN, invoice, USD price, RUB equivalent and recipient bank information. Both prices are explicit; no exchange rate is inferred. Russian amounts in words are calculated from integer cents. The two-party fields come from the saved car, while contract fields are editable and saved only to `cars.contract_details`.

The template contains the original contract's four sections, signature tables and appendix with the third-party payment instruction. Its original run/table/page formatting is retained. Personal, vehicle, invoice and banking values are replaced with placeholders; metadata, custom XML and thumbnail are removed. The source filled contract is not committed. `contract-template.json` contains gzip/base64 XML parts, decoded locally using DecompressionStream. The engine builds a valid uncompressed DOCX ZIP without third-party dependencies or external document services.

Required party fields: name, date of birth, document number, issue date/authority and registration address; buyer citizenship is also required by this template. Series, PIN and department code are optional; the latter two display an explicit dash when absent. Seller document type can be filled in the party form, otherwise the neutral label 'Документ' is used. This template is for individual sellers/buyers and includes the third-party-payment appendix on every generation.

The completed Word file is downloaded. Its contract data are saved in CRM; the file itself can be uploaded through Documents. No automatic PDF conversion or file attachment is claimed.

## Verification

`node test-contract.cjs` tests dates, numeric limits, money wording, XML escaping, missing data and generation with fictitious people. It writes `contract-qa.docx` (or CONTRACT_QA_OUTPUT) for local QA, not for committing. `node test-contract-ui.cjs` checks that failed/empty database responses block downloading and leave the form usable. The test DOCX was rendered and both pages inspected; fixed clauses and table labels were compared to the source XML. Live Supabase and browser UI were not tested.

After deploying, use fictitious parties first, save them, open the dialog, complete contract fields and generate Word. Confirm both pages, repeated VIN/invoice/names, amounts and appendix bank details. Reopen the card to confirm contract settings persisted. Longer names/addresses may increase the page count while preserving the template's formatting.
