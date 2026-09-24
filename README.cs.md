# Tisk štítků – Label Printing

> Aktuální verze: **v1.0.0**

Alma Cloud App pro tisk hřbetních štítků ze signatur fyzických jednotek.

## Dostupnost
Tato verze je určena pouze pro **České vysoké učení technické v Praze** (`420CARDS_CVUT`).

## Funkce
- načítání fyzických jednotek podle čárového kódu
- načítání itemizovaných setů fyzických jednotek
- převzetí fyzických jednotek vybraných na aktuální stránce Almy
- načtení signatury fyzické jednotky
- rozdělení signatury do samostatných řádků štítku
- tisk jedné fyzické jednotky na jednu stránku prohlížeče
- české a anglické rozhraní
- pouze čtení

## Formátování signatury
Signatura se rozděluje podle mezer. Například:

`QA76 .73 .J38 V57 2020 2`

se vytiskne jako:

```text
QA76
.73
.J38
V57
2020
2
```

Interpunkce, velikost písmen i obsah zůstávají zachovány.

## Tisk
Každá vybraná fyzická jednotka se tiskne jako samostatná stránka prohlížeče. Skutečný rozměr štítku, posun média a odřez zajišťuje ovladač tiskárny.

Tisk byl ověřen na cílové tiskárně Zebra.

## Bezpečnost
Aplikace je pouze pro čtení. V Almě nevytváří, neupravuje ani nemaže žádné záznamy.

## Repozitář
https://github.com/skopeant/tisk-stitku

## Licence
MIT License

Copyright (c) 2026 Antonín Skopec
