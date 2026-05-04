# Arkitektur

## Tech Stack

| Teknologi | Formål |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Tverrplattform mobilrammeverk |
| React 19 | UI-bibliotek |
| TypeScript ~5.9 | Typesikkerhet |
| React Navigation v7 | Bunnfaner + native stacker |
| @shopify/react-native-skia | Lerretsbasert slektstrerendering |
| AsyncStorage | Lokal datapersistens |
| Maestro | End-to-end-testing |

## Prosjektstruktur

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometri, SVG-ressurser
│   ├── FAB.tsx          # Floating action button
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Global tilstand (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # Alle app-skjermer
├── theme/               # Farger, typografi, mellomrom
├── types/               # Person, Relationship, Marriage typer
└── utils/               # UUID-generator, trelayout, relasjonsetiketter
```

## Tilstandshåndtering

Appen bruker React Context med `useReducer` for global tilstand. Data lagres til AsyncStorage med 500 ms debounce for å unngå overdreven skriving.

Handlinger inkluderer: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Slektstrerendering

Slektstreet tegnes på et Skia-lerret:

1. **Layout** (`treeLayout.ts`) — plasserer noder i hierarkisk layout, beregner grenforbindelser
2. **Geometri** (`geometry.ts`) — genererer organiske grenstier med naturlig avsmalning, knuter og dyredekorasjoner
3. **Lerret** (`FamilyTreeCanvas.tsx`) — rendrer Skia-stier, sirkler, tekst og håndterer berøringsinteraksjoner

## Testing

E2E-tester er skrevet med [Maestro](https://maestro.mobile.dev/) og ligger i `.maestro/`. Kjør dem med:

```bash
npm run test:e2e
```
