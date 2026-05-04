# Arkitektur

## Tech Stack

| Teknologi | Formål |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Tværplatform mobilramme |
| React 19 | UI-bibliotek |
| TypeScript ~5.9 | Typesikkerhed |
| React Navigation v7 | Bundfaner + native stakke |
| @shopify/react-native-skia | Canvas-baseret trærendering |
| AsyncStorage | Lokal datapersistens |
| Maestro | End-to-end-test |

## Projektstruktur

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometri, SVG-aktiver
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
├── screens/             # Alle app-skærme
├── theme/               # Farver, typografi, mellemrum
├── types/               # Person, Relationship, Marriage typer
└── utils/               # UUID-generator, trælayout, relationsetiketter
```

## Tilstandshåndtering

Appen bruger React Context med `useReducer` til global tilstand. Data gemmes til AsyncStorage med 500 ms debounce for at undgå overdrevne skrivninger.

Handlinger inkluderer: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Trærendering

Stamtræet tegnes på et Skia-canvas:

1. **Layout** (`treeLayout.ts`) — placerer knuder i et hierarkisk layout, beregner grenforbindelser
2. **Geometri** (`geometry.ts`) — genererer organiske grenstier med naturlig afsmalning, knuder og dyredekorationer
3. **Canvas** (`FamilyTreeCanvas.tsx`) — renderer Skia-stier, cirkler, tekst og håndterer berøringsinteraktioner

## Test

E2E-tests er skrevet med [Maestro](https://maestro.mobile.dev/) og findes i `.maestro/`. Kør dem med:

```bash
npm run test:e2e
```
