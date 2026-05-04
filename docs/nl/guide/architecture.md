# Architectuur

## Tech Stack

| Technologie | Doel |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Cross-platform mobiel framework |
| React 19 | UI-bibliotheek |
| TypeScript ~5.9 | Typeveiligheid |
| React Navigation v7 | Bottom tabs + native stacks |
| @shopify/react-native-skia | Canvas-gebaseerde stamboomrendering |
| AsyncStorage | Lokale gegevenspersistentie |
| Maestro | End-to-end testing |

## Projectstructuur

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometrie, SVG-assets
│   ├── FAB.tsx          # Floating action button
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Globale staat (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # Alle app-schermen
├── theme/               # Kleuren, typografie, spacing
├── types/               # Person, Relationship, Marriage typen
└── utils/               # UUID-generator, boomlayout, relatielabels
```

## State Management

De app gebruikt React Context met `useReducer` voor globale staat. Gegevens worden naar AsyncStorage opgeslagen met 500 ms debounce om overmatige schrijfbewerkingen te voorkomen.

Acties zijn onder andere: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Boomrendering

De stamboom wordt op een Skia-canvas getekend:

1. **Layout** (`treeLayout.ts`) — positioneert knooppunten in een hiërarchische lay-out, berekent takverbindingen
2. **Geometrie** (`geometry.ts`) — genereert organische takpaden met natuurlijke verjonging, knopen en dierdecoraties
3. **Canvas** (`FamilyTreeCanvas.tsx`) — rendert Skia-paden, cirkels, tekst en behandelt aanraakinteracties

## Testen

E2E-tests zijn geschreven met [Maestro](https://maestro.mobile.dev/) en bevinden zich in `.maestro/`. Voer ze uit met:

```bash
npm run test:e2e
```
