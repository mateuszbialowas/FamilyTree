# Bidrag

Tak for din interesse i at bidrage til FamilyTree!

## Kom godt i gang

1. Fork repositoryet
2. Klon din fork: `git clone https://github.com/DIT_BRUGERNAVN/FamilyTree.git`
3. Installer afhængigheder: `npm install`
4. Opret en branch: `git checkout -b feature/din-funktion`

## Udviklingsworkflow

1. Foretag dine ændringer
2. Test på både iOS- og Android-simulatorer
3. Kør E2E-test: `npm run test:e2e`
4. Commit dine ændringer med en beskrivende besked
5. Push og åbn en Pull Request

## Kodestil

- TypeScript bruges overalt — undgå `any`-typer
- Følg eksisterende mønstre for komponenter og skærme
- Brug det centraliserede tema (`src/theme/`) til farver, skrifttyper og mellemrum
- UI-tekst skal være på polsk (appens sprog)

## Tilføj en ny skærm

1. Opret skærmen i `src/screens/`
2. Tilføj den til den relevante navigationsstak i `src/navigation/`
3. Tilføj en Maestro E2E-test i `.maestro/`

## Rapportér problemer

Åbn venligst en issue på GitHub med:

- En klar beskrivelse af problemet
- Trin til at reproducere
- Forventet versus faktisk adfærd
- Enheds-/simulatorinformation

## Licens

Ved at bidrage accepterer du, at dine bidrag vil blive licenseret under MIT-licensen.
