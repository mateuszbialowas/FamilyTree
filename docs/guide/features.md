# Features

## Family Tree Visualization

The tree view renders an organic, hand-drawn-style family tree using `@shopify/react-native-skia`. Branches taper naturally from thick trunks to thin tips, with small animals (owls) perched on branches for a charming touch.

- Pinch to zoom and pan to navigate
- Tap any node to view that person's details
- Select a root person to re-center the tree

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/tree.png" alt="Tree view — descendants" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/tree-ancestors.png" alt="Tree view — ancestors" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## People Management

- Add family members with first name, last name, maiden name, birth date, and death date
- Person initials are displayed as avatars throughout the app
- Deceased members are shown with a mourning band on the tree

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/list.png" alt="People list" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail.png" alt="Person detail" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail2.png" alt="Person detail with relationships" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relationships

Define relationships between people:

- **Parent–Child** — automatically infers grandparent, great-grandparent, etc.
- **Marriage** — with optional wedding date
- **Siblings** — inferred from shared parents

The app computes extended relationship labels (uncle, cousin, nephew, etc.) automatically.

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/add-relationship.png" alt="Add relationship screen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

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

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/settings.png" alt="Settings screen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Privacy

All data is stored locally on the device using AsyncStorage. No data is sent to any server. See the [Privacy Policy](/privacy-policy) for details.
