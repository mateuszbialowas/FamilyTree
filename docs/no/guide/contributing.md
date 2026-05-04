# Bidra

Takk for din interesse i å bidra til FamilyTree!

## Kom i gang

1. Forke repositoryet
2. Klon din fork: `git clone https://github.com/DITT_BRUKERNAVN/FamilyTree.git`
3. Installer avhengigheter: `npm install`
4. Lag en branch: `git checkout -b feature/din-funksjon`

## Utviklingsarbeidsflyt

1. Gjør endringene dine
2. Test på både iOS- og Android-simulatorer
3. Kjør E2E-tester: `npm run test:e2e`
4. Commit endringene med en beskrivende melding
5. Push og åpne en Pull Request

## Kodestil

- TypeScript brukes overalt — unngå `any`-typer
- Følg eksisterende mønstre for komponenter og skjermer
- Bruk det sentraliserte temaet (`src/theme/`) for farger, fonter og mellomrom
- UI-tekst må være på polsk (appens språk)

## Legge til en ny skjerm

1. Lag skjermen i `src/screens/`
2. Legg den til i riktig navigasjonsstack i `src/navigation/`
3. Legg til en Maestro E2E-test i `.maestro/`

## Rapportere problemer

Vennligst åpne en issue på GitHub med:

- En tydelig beskrivelse av problemet
- Trinn for å reprodusere
- Forventet versus faktisk oppførsel
- Enhets-/simulatorinformasjon

## Lisens

Ved å bidra godtar du at bidragene dine vil bli lisensiert under MIT-lisensen.
