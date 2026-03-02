# Architecture

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React Native 0.81 + Expo ~54 | Cross-platform mobile framework |
| React 19 | UI library |
| TypeScript ~5.9 | Type safety |
| React Navigation v7 | Bottom tabs + native stacks |
| @shopify/react-native-skia | Canvas-based tree rendering |
| AsyncStorage | Local data persistence |
| Maestro | End-to-end testing |

## Project Structure

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, geometry, SVG assets
│   ├── FAB.tsx          # Floating action button
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # Global state (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # All app screens
├── theme/               # Colors, typography, spacing
├── types/               # Person, Relationship, Marriage types
└── utils/               # UUID generator, tree layout, relationship labels
```

## State Management

The app uses React Context with `useReducer` for global state. Data is persisted to AsyncStorage with a 500ms debounce to avoid excessive writes.

Actions include: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## Tree Rendering

The family tree is drawn on a Skia canvas:

1. **Layout** (`treeLayout.ts`) — positions nodes in a hierarchical layout, computes branch connections
2. **Geometry** (`geometry.ts`) — generates organic branch paths with natural tapering, knots, and animal decorations
3. **Canvas** (`FamilyTreeCanvas.tsx`) — renders the Skia paths, circles, text, and handles touch interactions

## Testing

E2E tests are written with [Maestro](https://maestro.mobile.dev/) and located in `.maestro/`. Run them with:

```bash
npm run test:e2e
```
