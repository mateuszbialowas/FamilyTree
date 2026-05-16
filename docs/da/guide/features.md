# Funktioner

## Stamtræsvisualisering

Trævisningen renderer et organisk, håndtegnet stamtræ med `@shopify/react-native-skia`. Grene smalner naturligt af fra tykke stammer til tynde spidser, med små dyr (ugler) på grenene for et charmerende strejf.

- Knib for at zoome og træk for at navigere
- Tryk på en knude for at se persondetaljer
- Vælg en rodperson for at centrere træet igen

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/da/tree.png" alt="Trævisning — efterkommere" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/da/tree-rooted-at-ancestor.png" alt="Stamtræ fra oldefar — hele familien" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personhåndtering

- Tilføj familiemedlemmer med fornavn, efternavn, pigenavn, fødselsdato og dødsdato
- Initialer vises som avatarer i hele appen
- Afdøde medlemmer vises med sørgebånd på træet

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/da/list.png" alt="Personliste" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/da/person-detail.png" alt="Persondetaljer" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relationer

Definér relationer mellem personer:

- **Forælder–barn** — udleder automatisk bedsteforældre, oldeforældre osv.
- **Ægteskab** — med valgfri bryllupsdato
- **Søskende** — udledt fra fælles forældre

Appen beregner udvidede relationsetiketter (onkel, fætter, nevø osv.) automatisk.

## Tre hovedfaner

| Fane | Beskrivelse |
|-----|-------------|
| **Drzewo** (Træ) | Interaktivt stamtræs-canvas |
| **Lista** (Liste) | Søgbar liste over alle familiemedlemmer |
| **Ustawienia** (Indstillinger) | Importer/eksporter data, app-info |

## Import og eksport

- **Eksporter** alle dine familiedata som en JSON-fil
- **Importer** en JSON-fil for at gendanne eller flette data
- Del eksporter med familiemedlemmer via systemets delemenu

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/da/settings.png" alt="Indstillinger" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Privatliv

Alle data gemmes lokalt på enheden via AsyncStorage. Ingen data sendes til nogen server. Se [Privatlivspolitik](/da/privacy-policy) for detaljer.
