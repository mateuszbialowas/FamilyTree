# FamilyTree 1.4.0

_Data: 2026-07-04_

Wersja aplikacji: **1.4.0** (build number inkrementowany automatycznie przez EAS — `production.autoIncrement: true`, `appVersionSource: remote`).

---

## 📱 App Store Connect — „Co nowego" (do wklejenia)

### 🇵🇱 Polski

```
Łatwiejsze dodawanie rodziny
• Dodając dziecko osobie, która ma małżonka, jednym dotknięciem połączysz je od razu z obojgiem rodziców.
• Możesz zaznaczyć, że ktoś nie żyje, nawet gdy nie znasz daty śmierci.
• Datę ślubu i rozwodu można teraz edytować w dowolnej chwili — dotknij ołówka przy małżonku. Datę ślubu ustawisz też od razu przy dodawaniu małżonka.
• Wygodniejsze wyszukiwanie osób przy tworzeniu relacji — pole szukania zawsze na górze, lista wyników pod nim.
• Ujednolicone okna wyboru daty w całej aplikacji.
```

### 🇬🇧 English

```
Easier family entry
• When you add a child to someone who has a spouse, link it to both parents in one tap.
• Mark a person as deceased even when you don't know the date of death.
• Marriage and divorce dates are now editable any time — tap the pencil on a spouse. You can also set the marriage date right when adding a spouse.
• Nicer person search when adding a relationship — the search field stays on top with results below it.
• Consistent date pickers across the whole app.
```

### 🇩🇪 Deutsch

```
```

### 🇳🇱 Nederlands

```
```

### 🇳🇴 Norsk

```
```

### 🇸🇪 Svenska

```
```

### 🇩🇰 Dansk

```
```

---

## 🛠️ Pełna lista zmian (techniczna)

### Nowe funkcje
- **Dziecko łączone z obojgiem rodziców**: dodając dziecko osobie z małżonkiem, sekcja „Drugi rodzic" pozwala jednym dotknięciem połączyć dziecko z obojgiem. Jeden małżonek — zaznaczony domyślnie (można odznaczyć); wielu — wybór z listy; brak — jak dotychczas.
- **Status „osoba nie żyje" bez daty**: nowe pole `Person.deceased` + przełącznik w formularzu osoby. Szczegóły pokazują „Nie żyje (data nieznana)", lista „ur. – ?", a drzewo rysuje wstążkę żałobną także bez daty. Zgodność wsteczna: istniejąca data śmierci nadal oznacza osobę zmarłą (helper `isDeceased`).
- **Edytowalne małżeństwo** (`UPDATE_MARRIAGE`): nowy ekran „Edytuj małżeństwo" dostępny ikoną ołówka na karcie małżonka — data ślubu **i data rozwodu** (ta druga wcześniej nie miała żadnego UI), zapis, usunięcie, walidacja „rozwód nie przed ślubem".
- **Data ślubu przy szybkim dodawaniu małżonka**: opcjonalne pole daty w przepływie „Dodaj małżonka" (wcześniej małżeństwo powstawało zawsze z `null`).

### Poprawki UX
- **Wyszukiwanie osób przy nowej relacji** przepisane: typ relacji, data i pole szukania przypięte na górze, wyniki jako przewijana `FlatList` pod spodem (pole szukania nie „ucieka" w dół; lepsza wydajność przy wielu osobach).
- **Ujednolicone okna daty**: data ślubu w oknie relacji używa teraz tego samego `DatePickerField` (modal Anuluj/Gotowe, `pl-PL`) co reszta aplikacji.
- **Podpowiedź na karcie małżonka bez daty**: „Brak daty ślubu — dotknij ołówka, aby dodać".

### Refaktoryzacja / jakość
- Wspólny typ `PersonFormValues` + mapper `personFieldsFromForm` — jedno źródło normalizacji danych formularza (koniec 3× duplikacji w PersonForm/AddPerson/EditPerson).
- Helpery `parentChildExists` / `marriageExists` w `relationships.ts`; uproszczone `handleSave` w ekranie relacji.
- `RelationType` przeniesiony do warstwy domenowej (`src/types`), `createAutoRelationship` otypowany na unię zamiast `string`.
- **Naprawa ukrytej utraty danych**: edycja osoby zachowuje `manualOrder` (wcześniej `UPDATE_PERSON` kasował ręczną kolejność rodzeństwa).
- Walidacja importu dopuszcza opcjonalne `deceased`; pola `deceased` zachowywane przy imporcie/eksporcie.

### Inne
- Tłumaczenia nowych tekstów we wszystkich 7 językach (pl, en, de, nl, no, sv, da).
- Nowe testy jednostkowe: `isDeceased`, `hasRequiredNames`, `personFieldsFromForm`, `parentChildExists`, `marriageExists`.

---

## 🚀 Deploy (kroki)

> Build number jest inkrementowany automatycznie przez EAS — nie trzeba go ustawiać ręcznie.

```bash
# 1. Zatwierdź bump wersji
git add app.json package.json changelog-1.4.0.md
git commit -m "Release 1.4.0"

# 2. Build produkcyjny iOS (EAS, w chmurze)
eas build --platform ios --profile production

# 3. Wyślij do App Store Connect
eas submit --platform ios --latest
```

4. W **App Store Connect** utwórz nową wersję **1.4.0**, wklej notatki „Co nowego" (sekcja wyżej) i podepnij nowy build.
