# Architektur

## Tech-Stack

| Technologie | Zweck |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Plattformübergreifendes Mobile-Framework |
| React 19 | UI-Bibliothek |
| TypeScript ~5.9 | Typsicherheit |
| React Navigation v7 | Bottom Tabs + Native Stacks |
| @shopify/react-native-skia | Canvas-basiertes Stammbaum-Rendering |
| AsyncStorage | Lokale Datenpersistenz |
| Maestro | End-to-End-Tests |

## Projektstruktur

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, Geometrie, SVG-Assets
│   ├── FAB.tsx          # Floating Action Button
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Globaler Zustand (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # Alle App-Bildschirme
├── theme/               # Farben, Typografie, Abstände
├── types/               # Person, Relationship, Marriage Typen
└── utils/               # UUID-Generator, Baumlayout, Beziehungslabels
```

## Zustandsverwaltung

Die App verwendet React Context mit `useReducer` für globalen Zustand. Daten werden mit 500 ms Debounce in AsyncStorage gespeichert, um übermäßige Schreibvorgänge zu vermeiden.

Aktionen umfassen: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Stammbaum-Rendering

Der Stammbaum wird auf einer Skia-Leinwand gezeichnet:

1. **Layout** (`treeLayout.ts`) — positioniert Knoten in einer hierarchischen Anordnung, berechnet Astverbindungen
2. **Geometrie** (`geometry.ts`) — generiert organische Astpfade mit natürlicher Verjüngung, Knoten und Tierdekorationen
3. **Canvas** (`FamilyTreeCanvas.tsx`) — rendert Skia-Pfade, Kreise, Text und behandelt Touch-Interaktionen

## Tests

E2E-Tests sind mit [Maestro](https://maestro.mobile.dev/) geschrieben und befinden sich in `.maestro/`. Ausführen mit:

```bash
npm run test:e2e
```
