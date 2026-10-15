# HydroScience COA Badge: Handoff

This file tells a Claude assistant (or a person) how to run the HydroScience COA badge system: what the pieces are, how to update a product when a new COA arrives, and how to add a new product.

## What the system is

Brands put a "3rd-Party Lab Tested" badge on their product pages. Clicking it opens a popup with the product's Certificate of Analysis (COA): six quality screens, potency against label claim, and the full COA PDF. The name "HydroScience Custom Formulations" at the bottom of the popup links to https://hydroscience.health/certifications/.

There are three pieces:

| Piece | Where it lives | What it does |
| --- | --- | --- |
| Badge sheet | Google Sheet "HydroScience COA Badges" in HydroScience's Drive | One row per product. The badge reads all its details from here |
| Badge script | GitHub repo `dawghauscreative/HSCF_CERTS-MANAGER`, served by GitHub Pages | Draws the badge and popup on any website |
| Embed code | On each brand's website | A two-line snippet with the product's `badge_id` |

Published sheet (read-only CSV the badge loads):
https://docs.google.com/spreadsheets/d/e/2PACX-1vR-QIcE9L1UbD7rp9zUscn5neva4zCCKZ02aHEj-kZBBPX0fcIsOJdN5YK-bT0w2rbAJHN36jL4K9yF/pub?output=csv

Editable sheet: open "HydroScience COA Badges" in HydroScience's Google Drive.

Script address (works once the repo is public and GitHub Pages is on):
https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/hs-coa-widget.min.js

Test page: https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/

Updating the sheet is the normal job. It needs edit access to the sheet only, not the repo. Changes appear on every site within about 5 minutes, since Google caches the published sheet.

## Sheet columns

Never rename, reorder, or delete the header row. Add new products as new rows below it.

| Column | What goes in it | Example |
| --- | --- | --- |
| `badge_id` | Unique ID used in the embed code. Lowercase letters, numbers, hyphens. Never change it once a brand has embedded it | `ultisana-cogniforte` |
| `active` | `yes` shows the badge. `no` hides it on every site | `yes` |
| `brand` | Brand name | `Ultisana` |
| `product` | Product name | `Cogniforte` |
| `lot` | Lot number of the batch currently being sold | `26-0301` |
| `coa_url` | Link to the COA PDF for that lot | `https://assets.cdn.filesafe.space/…/coa.pdf` |
| `certified` | Date of certification, MM/DD/YYYY | `03/01/2026` |
| `expires` | Expiration date, MM/DD/YYYY | `03/01/2028` |
| `potency` | Each active ingredient as `name|label claim|tested amount`, separated by `; ` | `Vitamin C|500 mg|560 mg; Zinc|15 mg|16.2 mg` |
| `tests` | Each screen as `name:result`, separated by `, ` | `Purity:Passed, Potency:Passed, Microbial Safety:Passed, Heavy Metals:Passed, Pesticide Residues:Passed, Residual Solvents:Passed` |
| `notes` | Internal notes. Never shown on the badge | `Lot 26-0301 COA received 03/02/2026` |

Optional columns the script also understands, if added to the header row: `pages` (comma-separated image links of the COA pages, for a better phone view), `verifier`, and `verifier_url`.

## Task: a new COA arrives for an existing product

The badge does not read the PDF. Every value shown comes from the sheet row, so the whole row must be updated, not just the link.

1. Get the new COA PDF and its public link. HydroScience hosts COAs on its filesafe.space media library.
2. Read the COA. HydroScience COAs follow the HSCF template:
   - **Section 1, General Product Information** → `brand`, `product`, `lot` (Lot Number), `certified` (Date of Certification), `expires` (Expiration Date).
   - **The six status icons** (Purity, Potency, Microbial Safety, Heavy Metals, Pesticide Residues, Residual Solvents) → `tests`, using each icon's result word exactly (`Passed`, or whatever the COA says).
   - **Section 2, Ingredient Verification** table → `potency`. Use the Ingredient, Label Claim, and Actual columns. Keep the units as written. The badge calculates the percentages itself.
3. Find the product's row by `badge_id` and replace `lot`, `coa_url`, `certified`, `expires`, `potency`, and `tests`. Leave `badge_id` unchanged.
4. Add a short line to `notes` with the lot and the date the COA was received.
5. Wait about 5 minutes, then open the brand's page or the test page and confirm the badge shows the new lot.

Rules:

- **Only enter values printed on the COA.** If a field is missing, unreadable, or still a template placeholder like `[Enter Lot Number]`, leave the old value alone and ask a person. Never guess or fill in a value.
- **Report anything that didn't pass.** If any screen says something other than Passed, or any ingredient tested below its label claim, tell a person before saving. The badge will show the failure publicly in orange.
- **If the tool can't edit the sheet**, write out the finished row values so a person can paste them in.

## Task: add a new product

1. Add a row with a new `badge_id` in the form `brand-product`, for example `nativeone-beef-organs`. Check that no other row uses the same ID.
2. Fill every column from the product's COA, following the steps above, and set `active` to `yes`.
3. Send the brand the embed code below with their `badge_id` in it.

## Embed code for brands

Light seal:

```html
<div data-hs-coa="BADGE_ID"></div>
<script src="https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/hs-coa-widget.min.js"></script>
```

Other styles, set on the first line:

- Dark seal: add `data-theme="dark"`.
- Small pill: add `data-variant="pill"`. It can also take `data-theme="dark"`.
- Floating corner badge: add `data-variant="float"`. Add `data-position="right"` for the bottom-right corner.

If a page has more than one badge, the `<script>` line only needs to appear once.

Where brands paste it: a Custom HTML block in WordPress, a Code module in Divi, an HTML/Text module in Themify, a Custom Liquid block in Shopify, or a Custom JS/HTML element in GoHighLevel. The badge only shows on the live page, not inside most page builders' editors.

## Task: hide a product's badge

Set `active` to `no`. The badge disappears from every site within about 5 minutes. Don't delete the row, so it can be turned back on.

## Changing the badge's design or code

This needs write access to the GitHub repo.

- `hs-coa-widget.js` is the readable source. `hs-coa-widget.min.js` is the file websites load.
- After editing the source, rebuild the minified file:
  `npx terser hs-coa-widget.js -c -m --comments "/^!/" --format ascii_only=true -o hs-coa-widget.min.js`
- Keep both files plain ASCII. Write special characters as `\u` escapes, or they show up garbled on some sites.
- The published sheet's address is set near the top of `hs-coa-widget.js` as `SHEET_URL`. Update it if the sheet is ever re-published under a new link.
- Commit both files. GitHub Pages republishes within a few minutes, and every site picks up the change.

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Badge missing on a site | `badge_id` doesn't match a row, the row has `active` = `no`, or the sheet was unpublished | Check the ID matches exactly. Check the published CSV link still opens |
| Badge shows old details | Google's 5-minute cache, or the site's own cache | Wait 5 minutes. Clear the site's cache |
| Code shows on the page as text | Pasted into a text block, or the user isn't an admin | Use the code block for that platform, logged in as an admin |
| Every badge disappeared at once | The script address stopped working | Check the repo is still public and GitHub Pages is on |
| Popup PDF is blank | `coa_url` is wrong or the file moved | Open the link directly and fix it in the sheet |
