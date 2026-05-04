# Functies

## Stamboomvisualisatie

De stamboomweergave rendert een organische, handgetekende stamboom met `@shopify/react-native-skia`. Takken lopen natuurlijk taps van dikke stammen naar dunne uiteinden, met kleine dieren (uilen) op de takken voor een charmant detail.

- Knijp om te zoomen en sleep om te navigeren
- Tik op een knooppunt om persoonsgegevens te bekijken
- Selecteer een hoofdpersoon om de boom opnieuw te centreren

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/tree.png" alt="Stamboom — afstammelingen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/tree-ancestors.png" alt="Stamboom — voorouders" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personenbeheer

- Voeg familieleden toe met voornaam, achternaam, meisjesnaam, geboortedatum en sterfdatum
- Initialen worden in de hele app als avatars weergegeven
- Overleden leden worden met een rouwband op de boom getoond

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/list.png" alt="Personenlijst" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail.png" alt="Persoonsdetails" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail2.png" alt="Persoonsdetails met relaties" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relaties

Definieer relaties tussen personen:

- **Ouder–kind** — leidt automatisch grootouders, overgrootouders enz. af
- **Huwelijk** — met optionele trouwdatum
- **Broers/zussen** — afgeleid van gedeelde ouders

De app berekent uitgebreide relatielabels (oom, neef, nicht enz.) automatisch.

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/add-relationship.png" alt="Scherm relatie toevoegen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Drie hoofdtabbladen

| Tabblad | Beschrijving |
|-----|-------------|
| **Drzewo** (Boom) | Interactief stamboomcanvas |
| **Lista** (Lijst) | Doorzoekbare lijst van alle familieleden |
| **Ustawienia** (Instellingen) | Gegevens importeren/exporteren, app-info |

## Import & Export

- **Exporteer** al uw familiegegevens als JSON-bestand
- **Importeer** een JSON-bestand om gegevens te herstellen of samen te voegen
- Deel exports met familieleden via het systeemdeelmenu

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/settings.png" alt="Instellingenscherm" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Privacy

Alle gegevens worden lokaal op het apparaat opgeslagen via AsyncStorage. Er worden geen gegevens naar een server verzonden. Zie het [Privacybeleid](/nl/privacy-policy) voor details.
