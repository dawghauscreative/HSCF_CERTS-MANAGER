# HydroScience COA Badge

A "3rd-Party Lab Tested" badge that brands embed on their sites. Clicking it opens the product's Certificate of Analysis with quality screens, potency against label claim, and the full PDF.

Badge details live in the **HydroScience COA Badges** Google Sheet. Edit a row there and every site showing that badge updates. Google caches the published sheet for up to 5 minutes.

## Embed code

Light badge:

```html
<div data-hs-coa="BADGE_ID"></div>
<script src="https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/hs-coa-widget.min.js"></script>
```

Dark badge:

```html
<div data-hs-coa="BADGE_ID" data-theme="dark"></div>
<script src="https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/hs-coa-widget.min.js"></script>
```

Replace `BADGE_ID` with the product's `badge_id` from the sheet.

The script is served by GitHub Pages, which needs this repo to be public with Pages turned on (Settings → Pages → Deploy from branch `main`, folder `/ (root)`). `index.html` is a test page: open https://dawghauscreative.github.io/HSCF_CERTS-MANAGER/ to check the script and sheet are working.

Other display options on the embed: `data-variant="pill"` or `"float"`, and `data-position="right"` for the floating badge.

## Sheet columns

| Column | What goes in it |
| --- | --- |
| `badge_id` | Short unique ID used in the embed code, e.g. `brandname-product` |
| `active` | `yes` to show the badge, `no` to hide it everywhere |
| `brand`, `product`, `lot` | Shown on the badge and in the popup |
| `coa_url` | Link to the COA PDF |
| `certified`, `expires` | Dates shown in the popup |
| `potency` | `Name|label amount|tested amount`, separated by `;` |
| `tests` | `Purity:Passed, Heavy Metals:Passed, …` Blank = the six standard screens, all Passed |
| `pages` | Optional. Comma-separated image links of the COA pages, for the best phone view |
| `notes` | Internal notes. Not shown |

Don't rename or reorder the header row's column names. New rows can go anywhere below it.

## Files

- `hs-coa-widget.min.js` is the file sites load.
- `hs-coa-widget.js` is the readable source. After editing it, rebuild the minified file:
  `npx terser hs-coa-widget.js -c -m --comments "/^!/" --format ascii_only=true -o hs-coa-widget.min.js`
