# תכונות

## ויזואליזציה של עץ המשפחה

תצוגת העץ מציגה עץ משפחה אורגני בסגנון מצויר ביד באמצעות `@shopify/react-native-skia`. ענפים מצרים באופן טבעי מגזעים עבים לקצוות דקים, עם חיות קטנות (ינשופים) על הענפים לטאצ' מקסים.

- צביטה לשינוי זום וגרירה לניווט
- הקישו על כל צומת כדי לראות את פרטי האדם
- בחרו אדם שורש כדי למרכז מחדש את העץ

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/tree.png" alt="תצוגת עץ — צאצאים" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/tree-ancestors.png" alt="תצוגת עץ — אבות" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## ניהול אנשים

- הוספת בני משפחה עם שם פרטי, שם משפחה, שם נעורים, תאריך לידה ותאריך פטירה
- ראשי תיבות מוצגים כאווטרים בכל האפליקציה
- בני משפחה שנפטרו מוצגים עם סרט אבל בעץ

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/list.png" alt="רשימת אנשים" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail.png" alt="פרטי אדם" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail2.png" alt="פרטי אדם עם קשרים" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## קשרים

הגדירו קשרים בין אנשים:

- **הורה–ילד** — מסיק אוטומטית סבים, סבים-רבא וכו'
- **נישואין** — עם תאריך חתונה אופציונלי
- **אחים** — מסיק מהורים משותפים

האפליקציה מחשבת תוויות קשר מורחבות (דוד, בן דוד, אחיין וכו') באופן אוטומטי.

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/add-relationship.png" alt="מסך הוספת קשר" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## שלוש לשוניות עיקריות

| לשונית | תיאור |
|-----|-------------|
| **Drzewo** (עץ) | קנבס עץ משפחה אינטראקטיבי |
| **Lista** (רשימה) | רשימה הניתנת לחיפוש של כל בני המשפחה |
| **Ustawienia** (הגדרות) | ייבוא/ייצוא נתונים, מידע על האפליקציה |

## ייבוא וייצוא

- **ייצאו** את כל נתוני המשפחה כקובץ JSON
- **ייבאו** קובץ JSON לשחזור או מיזוג נתונים
- שתפו ייצואים עם בני משפחה דרך תפריט השיתוף של המערכת

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/settings.png" alt="מסך הגדרות" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## פרטיות

כל הנתונים מאוחסנים מקומית במכשיר באמצעות AsyncStorage. אין נתונים הנשלחים לשרת. ראו [מדיניות פרטיות](/he/privacy-policy) לפרטים.
