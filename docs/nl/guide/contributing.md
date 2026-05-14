# Bijdragen

Bedankt voor uw interesse om bij te dragen aan Stamboom!

## Aan de slag

1. Fork de repository
2. Clone uw fork: `git clone https://github.com/UW_GEBRUIKERSNAAM/FamilyTree.git`
3. Installeer dependencies: `npm install`
4. Maak een branch: `git checkout -b feature/uw-feature`

## Ontwikkelingsworkflow

1. Maak uw wijzigingen
2. Test op zowel iOS- als Android-simulators
3. Voer E2E-tests uit: `npm run test:e2e`
4. Commit uw wijzigingen met een beschrijvend bericht
5. Push en open een Pull Request

## Codestijl

- TypeScript wordt overal gebruikt — vermijd `any`-typen
- Volg bestaande patronen voor componenten en schermen
- Gebruik het centrale thema (`src/theme/`) voor kleuren, fonts en spacing
- UI-tekst moet in het Pools zijn (de app-taal)

## Een nieuw scherm toevoegen

1. Maak het scherm aan in `src/screens/`
2. Voeg het toe aan de juiste navigatiestack in `src/navigation/`
3. Voeg een Maestro E2E-test toe in `.maestro/`

## Problemen melden

Open een issue op GitHub met:

- Een duidelijke beschrijving van het probleem
- Stappen om te reproduceren
- Verwacht versus daadwerkelijk gedrag
- Apparaat-/simulatorinfo

## Licentie

Door bij te dragen gaat u ermee akkoord dat uw bijdragen onder de MIT-licentie worden gelicenseerd.
