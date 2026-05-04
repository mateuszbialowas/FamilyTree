# ארכיטקטורה

## ערימת טכנולוגיות

| טכנולוגיה | מטרה |
|-----------|---------|
| React Native 0.81 + Expo ~54 | מסגרת מובייל חוצת פלטפורמות |
| React 19 | ספריית UI |
| TypeScript ~5.9 | בטיחות טיפוסים |
| React Navigation v7 | לשוניות תחתונות + מקבצים מקומיים |
| @shopify/react-native-skia | רינדור עץ מבוסס קנבס |
| AsyncStorage | התמדת נתונים מקומית |
| Maestro | בדיקות end-to-end |

## מבנה הפרויקט

```
src/
├── components/
│   ├── ui/              # Button, TextInput, Card, ScreenHeader, EmptyState, Divider
│   ├── tree/            # FamilyTreeCanvas, גיאומטריה, נכסי SVG
│   ├── FAB.tsx          # כפתור פעולה צף
│   ├── PersonListItem.tsx
│   └── RelationshipCard.tsx
├── context/
│   └── FamilyContext.tsx # מצב גלובלי (useReducer + AsyncStorage)
├── navigation/
│   ├── BottomTabs.tsx   # Drzewo, Lista, Ustawienia
│   ├── TreeStack.tsx
│   ├── ListStack.tsx
│   └── SettingsStack.tsx
├── screens/             # כל מסכי האפליקציה
├── theme/               # צבעים, טיפוגרפיה, מרווחים
├── types/               # סוגי Person, Relationship, Marriage
└── utils/               # מחולל UUID, פריסת עץ, תוויות קשר
```

## ניהול מצב

האפליקציה משתמשת ב-React Context עם `useReducer` למצב גלובלי. נתונים נשמרים ב-AsyncStorage עם השהיית 500 אלפיות שנייה כדי למנוע כתיבות מוגזמות.

פעולות כוללות: `ADD_PERSON`, `UPDATE_PERSON`, `DELETE_PERSON`, `ADD_RELATIONSHIP`, `DELETE_RELATIONSHIP`, `ADD_MARRIAGE`, `DELETE_MARRIAGE`, `IMPORT_DATA`.

## רינדור עץ

עץ המשפחה מצויר על קנבס Skia:

1. **פריסה** (`treeLayout.ts`) — ממקמת צמתים בפריסה היררכית, מחשבת חיבורי ענפים
2. **גיאומטריה** (`geometry.ts`) — יוצרת מסלולי ענפים אורגניים עם הצרה טבעית, קשרים וקישוטי חיות
3. **קנבס** (`FamilyTreeCanvas.tsx`) — מציג מסלולי Skia, עיגולים, טקסט ומטפל באינטראקציות מגע

## בדיקות

בדיקות E2E כתובות עם [Maestro](https://maestro.mobile.dev/) ונמצאות ב-`.maestro/`. הריצו אותן עם:

```bash
npm run test:e2e
```
