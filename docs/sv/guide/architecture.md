# Arkitektur

## Tech Stack

| Teknik | Syfte |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Plattformsoberoende mobilramverk |
| React 19 | UI-bibliotek |
| TypeScript ~5.9 | Typsäkerhet |
| React Navigation v7 | Bottenflikar + native stackar |
| @shopify/react-native-skia | Canvas-baserad trädrendering |
| AsyncStorage | Lokal datapersistens |
| Maestro | End-to-end-testning |

## Projektstruktur

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometri, SVG-tillgångar
│   ├── FAB.tsx          # Floating action button
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Globalt tillstånd (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # Alla app-skärmar
├── theme/               # Färger, typografi, mellanrum
├── types/               # Person, Relationship, Marriage typer
└── utils/               # UUID-generator, trädlayout, relationsetiketter
```

## Tillståndshantering

Appen använder React Context med `useReducer` för globalt tillstånd. Data sparas till AsyncStorage med 500 ms debounce för att undvika överdriven skrivning.

Åtgärder inkluderar: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Trädrendering

Släktträdet ritas på en Skia-canvas:

1. **Layout** (`treeLayout.ts`) — placerar noder i en hierarkisk layout, beräknar grenkopplingar
2. **Geometri** (`geometry.ts`) — genererar organiska grenstigar med naturlig avsmalning, knutar och djurdekorationer
3. **Canvas** (`FamilyTreeCanvas.tsx`) — renderar Skia-stigar, cirklar, text och hanterar pekinteraktioner

## Testning

E2E-tester är skrivna med [Maestro](https://maestro.mobile.dev/) och finns i `.maestro/`. Kör dem med:

```bash
npm run test:e2e
```
