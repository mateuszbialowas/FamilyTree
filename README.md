# FamilyTree

A mobile genealogy app for creating and managing family trees. Built with React Native (Expo), it lets users add family members, define relationships, and visualize their family tree as an organic, animated tree.

**UI Language:** Polish

## Features

### People Management
- **Add a person** — first name, last name, gender (male/female), birth date, death date, notes
- **Edit a person** — modify any field of an existing person
- **Delete a person** — removes the person and all associated relationships
- **Search** — filter people list by first or last name

### Relationships
- **Parent-Child** — define who is the parent of whom
- **Marriage** — link two people as spouses, optionally with marriage/divorce dates
- **Sibling** — auto-created by sharing the same parent(s)
- **Remove relationship** — delete any individual relationship without affecting the people

### Tree Visualization

The tree is rendered on an interactive Skia canvas with procedurally generated organic visuals (bark, leaves, animals).

#### Tree Root & Direction

| Concept | Description |
|---|---|
| **Root** | The selected person from whom the tree grows. Users pick the root via a dropdown at the top of the Tree screen. |
| **Descendants mode** | The root is at the **top**. Children grow **downward**. Each generation is placed below its parents. |
| **Ancestors mode** | The root is at the **bottom**. Parents grow **upward**. Each generation of ancestors is placed above. The layout is computed top-down then vertically flipped. |
| **Both mode** | The root is in the **middle**. Ancestors grow **upward**, descendants grow **downward**. Both trees are computed independently and merged at the root node. |
| **Auto-detection** | The app auto-detects the best mode: root has both children and parents → both; only children → descendants; only parents → ancestors. The user can override manually (tap the active button again to return to auto). |

#### Layout Algorithm (`treeLayout.ts`)

```
                 Root (depth 0)
                   |
              [TRUNK — vertical line from root]
             /           \
        Child A         Child B        ← depth 1
        (solo)        + Spouse
                         |
                    [TRUNK from couple midpoint]
                   /          \
             Grandchild 1   Grandchild 2   ← depth 2
```

**How it works:**

1. **Build tree** — Starting from the root, recursively collects spouse + children (descendants mode), parents (ancestors mode), or both directions into a `TreePerson` hierarchy.
2. **Calculate widths** — `subW()` computes the horizontal space each subtree needs. A couple needs 160px minimum, a solo node needs 80px. Children are spaced with a 40px gap between them.
3. **Place nodes** — `place()` positions each node at (x, y):
   - **Couples** are placed side by side, 40px left and right of center.
   - **Solo nodes** are centered.
   - A **trunk** (vertical line) extends from the node/couple downward.
   - **Branches** (curved lines) fan out from the trunk bottom to each child.
4. **Generation height** — Each generation is 200px apart vertically. The root generation gets an extra 60px to make the trunk more prominent.
5. **Normalize** — All nodes are shifted so the leftmost node is at x=60 (left margin).
6. **Flip for ancestors** — In ancestor mode, the Y-axis is mirrored so ancestors appear above the root.
7. **Disconnected people** — Anyone not in the tree is shown as standalone nodes to the right of the tree.

#### Connections Between Nodes

| Connection | Visual | When |
|---|---|---|
| **Couple line** | Double red horizontal line with gold circle at center | Two people are married |
| **Trunk** | Thick vertical organic bark shape | Connects a parent (or couple midpoint) to the branch junction below |
| **Branch** | Curved organic bark shape with bezier curves | Connects the trunk bottom to each child node |

#### Organic Visuals (procedural generation)

- **Trunks** — 28-segment shapes with taper, root flare, bark furrows, cracks, highlights, knots, and moss patches
- **Roots** — 6-8 organic root paths growing from the trunk base (direction depends on tree mode: up for descendants, down for ancestors, omitted in both mode)
- **Branches** — 18-segment curves with gravity droop, S-curves, bark lines, and twigs
- **Leaves** — 3-layer canopy system (deep/mid/light colors) with 3 leaf shape variants, placed around trunks and branches
- **Animals** — Owl on the main trunk, birds and squirrels scattered on branches (seeded randomization)

#### Animations
- Leaf sway (5s wind cycle)
- Owl blinking (every 3.5s)
- Bird bobbing
- Squirrel tail wagging

#### Gestures
- **Tap** a node → navigate to person detail
- **Long press** a node → quick-add a relative (parent/child/spouse/sibling)
- **Pan** → move around the tree (with momentum decay)
- **Pinch** → zoom (0.3x to 4x)
- **Center button** → reset view to the root node

### Data Management
- **Auto-save** — state persists to AsyncStorage with 500ms debounce
- **Export** — save family data as JSON file (via sharing)
- **Import** — load family data from a JSON file
- **Clear all** — delete all people and relationships (with confirmation)

## Data Model

```typescript
Person {
  id, firstName, lastName, gender, birthDate, deathDate, notes
}

ParentChildRelationship {
  id, parentId, childId
}

Marriage {
  id, spouse1Id, spouse2Id, marriageDate, divorceDate
}
```

## Architecture

```
src/
├── components/
│   ├── tree/          — Canvas rendering (Skia), geometry generation, animals
│   │   ├── palette.ts        — Color constants for tree visuals
│   │   ├── mathHelpers.ts    — Seeded random, lerp, pick
│   │   ├── skiaHelpers.ts    — Skia path/paragraph builders
│   │   ├── geometry.ts       — Trunk, branch, leaf, root, animal generation
│   │   ├── animals.tsx       — Owl, bird, squirrel Skia components
│   │   └── FamilyTreeCanvas.tsx — Main tree canvas with gestures & animations
│   ├── ui/            — Reusable primitives (Button, TextInput, Card, etc.)
│   ├── PersonForm.tsx — Shared form for adding/editing a person
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx — Global state (useReducer + AsyncStorage persistence)
├── navigation/
│   ├── stackConfig.ts — Shared navigation options and screen registrations
│   ├── BottomTabs.tsx — 3 tabs: Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx / ListStack.tsx / SettingsStack.tsx
│   └── RootNavigator.tsx
├── screens/           — Screen components (Tree, PeopleList, PersonDetail, etc.)
├── theme/             — Colors, typography, spacing, shared form styles
├── types/             — TypeScript type definitions
└── utils/             — UUID generator, storage, date helpers, relationships, tree layout
```

## Tech Stack

| Tool | Version |
|---|---|
| Expo | ~54.0.33 |
| React | 19.1.0 |
| React Native | 0.81.5 |
| TypeScript | ~5.9.2 |
| @shopify/react-native-skia | 2.2.12 |
| React Navigation | v7 |
| AsyncStorage | 2.2.0 |

## Commands

```bash
npm start                        # Start Expo dev server
npx expo run:ios                 # Build & run on iOS simulator
npx expo run:android             # Build & run on Android emulator
npm run test:e2e                 # Run all Maestro E2E tests
npm run test:e2e:single <file>   # Run a single Maestro test
```
