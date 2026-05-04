# Funksjoner

## Slektstrevisualisering

Slektstrevisningen rendrer et organisk, håndtegnet slektstre med `@shopify/react-native-skia`. Grener avsmalner naturlig fra tykke stammer til tynne tupper, med små dyr (ugler) på grenene for et sjarmerende preg.

- Knip for å zoome og dra for å navigere
- Trykk på en node for å se persondetaljer
- Velg en rotperson for å sentrere treet på nytt

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/tree.png" alt="Slektstre — etterkommere" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/tree-ancestors.png" alt="Slektstre — forfedre" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personhåndtering

- Legg til familiemedlemmer med fornavn, etternavn, pikenavn, fødselsdato og dødsdato
- Initialer vises som avatarer gjennom hele appen
- Avdøde medlemmer vises med sørgebånd på treet

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/list.png" alt="Personliste" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail.png" alt="Persondetaljer" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail2.png" alt="Persondetaljer med relasjoner" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relasjoner

Definer relasjoner mellom personer:

- **Forelder–barn** — utleder automatisk besteforeldre, oldeforeldre osv.
- **Ekteskap** — med valgfri bryllupsdato
- **Søsken** — utledet fra felles foreldre

Appen beregner utvidede relasjonsetiketter (onkel, søskenbarn, nevø osv.) automatisk.

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/add-relationship.png" alt="Legg til relasjon" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Tre hovedfaner

| Fane | Beskrivelse |
|-----|-------------|
| **Drzewo** (Tre) | Interaktivt slektstrelerret |
| **Lista** (Liste) | Søkbar liste over alle familiemedlemmer |
| **Ustawienia** (Innstillinger) | Importer/eksporter data, app-info |

## Import og eksport

- **Eksporter** alle familiedata som en JSON-fil
- **Importer** en JSON-fil for å gjenopprette eller slå sammen data
- Del eksporter med familiemedlemmer via systemets delemeny

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/settings.png" alt="Innstillinger" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personvern

Alle data lagres lokalt på enheten via AsyncStorage. Ingen data sendes til server. Se [Personvernerklæring](/no/privacy-policy) for detaljer.
