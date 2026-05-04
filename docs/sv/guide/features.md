# Funktioner

## Släktträdsvisualisering

Trädvyn renderar ett organiskt, handritat släktträd med `@shopify/react-native-skia`. Grenar smalnar av naturligt från tjocka stammar till tunna spetsar, med små djur (ugglor) på grenarna för en charmig touch.

- Nyp för att zooma och dra för att navigera
- Tryck på en nod för att se persondetaljer
- Välj en rotperson för att centrera trädet på nytt

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/sv/tree.png" alt="Trädvy — ättlingar" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/sv/tree-zoomed-out.png" alt="Trädvy — förfäder" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personhantering

- Lägg till familjemedlemmar med förnamn, efternamn, flicknamn, födelsedatum och dödsdatum
- Initialer visas som avatarer i hela appen
- Avlidna medlemmar visas med sorgband på trädet

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/sv/list.png" alt="Personlista" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/sv/person-detail.png" alt="Persondetaljer" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relationer

Definiera relationer mellan personer:

- **Förälder–barn** — härleder automatiskt mor- och farföräldrar, mormorsföräldrar osv.
- **Äktenskap** — med valfritt bröllopsdatum
- **Syskon** — härlett från gemensamma föräldrar

Appen beräknar utökade relationsetiketter (farbror, kusin, brorson osv.) automatiskt.

## Tre huvudflikar

| Flik | Beskrivning |
|-----|-------------|
| **Drzewo** (Träd) | Interaktivt släktträds-canvas |
| **Lista** (Lista) | Sökbar lista över alla familjemedlemmar |
| **Ustawienia** (Inställningar) | Importera/exportera data, app-info |

## Import och export

- **Exportera** all din familjedata som en JSON-fil
- **Importera** en JSON-fil för att återställa eller slå samman data
- Dela exporter med familjemedlemmar via systemets delningsmeny

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/sv/settings.png" alt="Inställningar" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Integritet

All data lagras lokalt på enheten via AsyncStorage. Ingen data skickas till någon server. Se [Integritetspolicyn](/sv/privacy-policy) för detaljer.
