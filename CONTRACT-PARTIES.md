# Seller and buyer data

Run `setup-car-parties.sql` before deploying this change. Existing cars get empty seller and buyer objects. Access continues to use the existing test CRM policies; the migration does not disable RLS or create public policies.

Each car stores its own transaction-specific `seller` and `buyer` JSON objects. All fields are strings. Blank fields are allowed while preparing a transaction. Passport identifiers retain leading zeros, spaces and letters, supporting foreign passports. Dates use `YYYY-MM-DD`. Each participant is saved independently and read back before showing success. History records the role and save event, without copying passport details.

## Future contract templates

`buildContractPartyData(car)` returns flat values from the saved car record, with `seller_` and `buyer_` prefixes. For example: `seller_full_name`, `buyer_passport_number`, `buyer_registration_address`. Field suffixes:

- full_name
- birth_date
- birth_place
- citizenship
- passport_series
- passport_number
- passport_issued_at
- passport_issued_by
- passport_department_code
- registration_address
- phone
- email

This increment does not generate contracts or introduce a template engine. The next increment needs the approved original DOCX template and a mapping of its fields, preserving all clauses and attachments. Format dates for the template at generation time; validate its required fields then. Vehicle, price, contract date/number and invoice fields should be mapped separately. Do not substitute defaults for missing legal particulars.

## Checks

Run `node --check parties.js` and `node test-parties.cjs`. Supabase is mocked; no real personal data is written by tests. After deployment, save fictitious seller and buyer details, refresh the card, check independent persistence, cancellation and history. Existing document and photo flows should remain available.
