# Bidra

Tack för ditt intresse för att bidra till Släktträd!

## Kom igång

1. Forka repositoryt
2. Klona din fork: `git clone https://github.com/DITT_ANVÄNDARNAMN/FamilyTree.git`
3. Installera beroenden: `npm install`
4. Skapa en branch: `git checkout -b feature/din-funktion`

## Utvecklingsarbetsflöde

1. Gör dina ändringar
2. Testa på både iOS- och Android-simulatorer
3. Kör E2E-tester: `npm run test:e2e`
4. Committa dina ändringar med ett beskrivande meddelande
5. Pusha och öppna en Pull Request

## Kodstil

- TypeScript används överallt — undvik `any`-typer
- Följ befintliga mönster för komponenter och skärmar
- Använd det centraliserade temat (`src/theme/`) för färger, typsnitt och mellanrum
- UI-text måste vara på polska (appens språk)

## Lägga till en ny skärm

1. Skapa skärmen i `src/screens/`
2. Lägg till den i lämplig navigeringsstack i `src/navigation/`
3. Lägg till ett Maestro E2E-test i `.maestro/`

## Rapportera problem

Vänligen öppna ett issue på GitHub med:

- En tydlig beskrivning av problemet
- Steg för att reproducera
- Förväntat kontra faktiskt beteende
- Enhets-/simulatorinformation

## Licens

Genom att bidra godkänner du att dina bidrag licensieras under MIT-licensen.
