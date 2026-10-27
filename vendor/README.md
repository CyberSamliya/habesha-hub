# Third-party libraries (self-hosted)

The site's Content Security Policy only allows scripts from this domain, so these
libraries are hosted here instead of loading from a CDN. They are loaded only by
`resume.html`, and only when a visitor downloads a resume.

| File | Library | Version | License | Source |
|---|---|---|---|---|
| `jspdf-4.2.1.umd.min.js` | jsPDF (PDF with selectable text) | 4.2.1 | MIT (`jspdf-LICENSE.txt`) | npm `jspdf@4.2.1`, `dist/jspdf.umd.min.js` |
| `docx-9.8.1.iife.js` | docx (editable Word .docx) | 9.8.1 | MIT (`docx-LICENSE.txt`) | npm `docx@9.8.1`, `dist/index.iife.js` |

To update: install the new version with `npm install --ignore-scripts`, copy the same
files, rename with the new version, and update the paths in `resume.js`.
