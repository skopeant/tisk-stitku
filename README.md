# Tisk štítků – Label Printing

> Current version: **v1.0.0**

Alma Cloud App for printing spine labels from physical item call numbers.

## Availability
This version is restricted to **Czech Technical University in Prague** (`420CARDS_CVUT`).

## Features
- load physical items by barcode
- load itemized physical-item sets
- use physical items selected on the current Alma page
- read the physical item call number
- split the call number into separate label lines
- print one physical item per browser-print page
- Czech and English UI
- read-only operation

## Call number formatting
The call number is split on whitespace. For example:

`QA76 .73 .J38 V57 2020 2`

is printed as:

```text
QA76
.73
.J38
V57
2020
2
```

Punctuation, case, and content are preserved.

## Printing
Each selected physical item is printed as a separate browser-print page. The printer driver handles the actual label media size, feed, and cutter behavior.

Printing has been verified with the target Zebra label printer.

## Security
The app is read-only. It does not create, modify, or delete Alma records.

## Repository
https://github.com/skopeant/tisk-stitku

## License
MIT License

Copyright (c) 2026 Antonín Skopec
