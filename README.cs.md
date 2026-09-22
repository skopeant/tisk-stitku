# Tisk štítků / Label Printing

> Aktuální verze: **v0.1.2 BETA**

Beta Cloud App připravená pro odeslání do Ex Libris a omezená na ČVUT (`420CARDS_CVUT`) pro tisk hřbetních štítků ze signatur fyzických jednotek.

## Režimy výběru

- **Načíst jednotky** – načítání čárových kódů po jednom.
- **Set** – načtení itemizovaného setu typu Physical items.
- **Vybrané jednotky** – převzetí fyzických jednotek vybraných na aktuální stránce Almy přes `entities$`.

## Signatura

Aplikace používá aktuální `holding_data.call_number` (Signatura jednotky). Pokud není k dispozici, zkouší permanentní/parsed/alternativní signaturu.

Signatura se pro první test rozděluje po mezerách. Například:

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

## Tisk

Každá jednotka je samostatná HTML tisková stránka (`break-after: page`). Rozměr stránky není v aplikaci zatím nastaven; používá se formát/médium nastavené v ovladači tiskárny (test se Zebrou).

## Omezení testovací verze

- určeno jen pro ČVUT,
- bez nastavování velikosti štítku a řezu v aplikaci,
- itemizované sety se načítají přes Set Members API; u fyzických jednotek se barcode bere z `member.description`,
- aplikace je pouze pro čtení.
