# Features

## Family Tree Visualization

The tree view renders an organic, hand-drawn-style family tree using `@shopify/react-native-skia`. Branches taper naturally from thick trunks to thin tips, with small animals (owls) perched on branches for a charming touch.

- Pinch to zoom and pan to navigate
- Tap any node to view that person's details
- Select a root person to re-center the tree

## People Management

- Add family members with first name, last name, maiden name, birth date, and death date
- Person initials are displayed as avatars throughout the app
- Deceased members are shown with a mourning band on the tree

## Relationships

Define relationships between people:

- **Parent–Child** — automatically infers grandparent, great-grandparent, etc.
- **Marriage** — with optional wedding date
- **Siblings** — inferred from shared parents

The app computes extended relationship labels (uncle, cousin, nephew, etc.) automatically.

## Three Main Tabs

| Tab | Description |
|-----|-------------|
| **Drzewo** (Tree) | Interactive family tree canvas |
| **Lista** (List) | Searchable list of all family members |
| **Ustawienia** (Settings) | Import/export data, app info |

## Import & Export

- **Export** your entire family data as a JSON file
- **Import** a JSON file to restore or merge family data
- Share exports with family members via the system share sheet

## Privacy

All data is stored locally on the device using AsyncStorage. No data is sent to any server. See the [Privacy Policy](/privacy-policy) for details.
