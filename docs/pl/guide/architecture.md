# Architektura

## Stos technologiczny

| Technologia | Zastosowanie |
|-------------|-------------|
| React Native 0.81 + Expo ~54 | Wieloplatformowy framework mobilny |
| React 19 | Biblioteka UI |
| TypeScript ~5.9 | Bezpieczeństwo typów |
| React Navigation v7 | Zakładki dolne + stosy natywne |
| @shopify/react-native-skia | Renderowanie drzewa na płótnie |
| AsyncStorage | Lokalne przechowywanie danych |
| Maestro | Testy end-to-end |

## Struktura projektu

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometria, zasoby SVG
│   ├── FAB.tsx          # Pływający przycisk akcji
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Stan globalny (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # Wszystkie ekrany aplikacji
├── theme/               # Kolory, typografia, odstępy
├── types/               # Typy Person, Relationship, Marriage
└── utils/               # Generator UUID, układ drzewa, etykiety relacji
```

## Zarządzanie stanem

Aplikacja używa React Context z `useReducer` do zarządzania stanem globalnym. Dane są zapisywane do AsyncStorage z opóźnieniem 500ms (debounce), aby uniknąć nadmiernych zapisów.

Akcje: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Renderowanie drzewa

Drzewo rodzinne jest rysowane na płótnie Skia:

1. **Układ** (`treeLayout.ts`) — pozycjonuje węzły w hierarchicznym układzie, oblicza połączenia gałęzi
2. **Geometria** (`geometry.ts`) — generuje organiczne ścieżki gałęzi z naturalnym zwężaniem, sękami i dekoracjami zwierząt
3. **Płótno** (`FamilyTreeCanvas.tsx`) — renderuje ścieżki Skia, okręgi, tekst i obsługuje interakcje dotykowe

## Testowanie

Testy E2E są napisane w [Maestro](https://maestro.mobile.dev/) i znajdują się w `.maestro/`. Uruchom je:

```bash
npm run test:e2e
```
