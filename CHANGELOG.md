# Changelog

## 0.1.1

- Fixed Angular template build error caused by an arrow function in `[checked]`.
- Added `allItemsChecked` getter and kept the same UI behavior.

## 0.1.0

- Initial CTU-only test version.
- Scan items by barcode.
- Load itemized physical-item sets.
- Use physical items selected on the current Alma page via `entities$`.
- Read current item call number and split it into label lines by whitespace.
- Print each selected item as a separate browser-print page.
- Czech and English UI.
- Read-only.
