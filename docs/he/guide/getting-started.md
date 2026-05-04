# תחילת העבודה

## דרישות מקדימות

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- סימולטור iOS (macOS) או אמולטור Android

## התקנה

```bash
# שכפול המאגר
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# התקנת תלויות
npm install
```

## הפעלת האפליקציה

### סימולטור iOS

```bash
npx expo run:ios
```

### אמולטור Android

```bash
npx expo run:android
```

### שרת פיתוח Expo

```bash
npm start
```

לאחר מכן הקישו `i` עבור iOS או `a` עבור Android.

## הגדרת הפרויקט

הפרויקט משתמש ב-Expo עם הארכיטקטורה החדשה מופעלת. לאחר שכפול אין צורך בהגדרה נוספת — פשוט התקינו תלויות והפעילו.

אם אתם משנים הגדרות מקומיות (למשל מזהה חבילה, הרשאות), צרו מחדש את הפרויקטים המקומיים:

```bash
npx expo prebuild --clean
```
