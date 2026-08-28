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
Familie leichter erfassen
• Fügst du einem Ehepartner-Paar ein Kind hinzu, verknüpfst du es mit einem Tipp gleich mit beiden Eltern.
• Markiere eine Person als verstorben, auch wenn du das Sterbedatum nicht kennst.
• Hochzeits- und Scheidungsdatum lassen sich jetzt jederzeit bearbeiten — tippe auf den Stift beim Ehepartner. Das Hochzeitsdatum kannst du auch direkt beim Hinzufügen eines Ehepartners angeben.
• Angenehmere Personensuche beim Anlegen einer Beziehung — das Suchfeld bleibt oben, die Ergebnisse darunter.
• Einheitliche Datumsauswahl in der ganzen App.
```

### 🇳🇱 Nederlands

```
Familie sneller invoeren
• Voeg je een kind toe aan iemand met een partner, dan koppel je het met één tik meteen aan beide ouders.
• Markeer iemand als overleden, ook als je de overlijdensdatum niet weet.
• Trouw- en scheidingsdatum zijn nu altijd aan te passen — tik op het potlood bij een partner. De trouwdatum stel je ook direct in bij het toevoegen van een partner.
• Fijner zoeken naar personen bij een nieuwe relatie — het zoekveld blijft bovenaan, de resultaten eronder.
• Overal in de app dezelfde datumkiezer.
```

### 🇳🇴 Norsk

```
Enklere å legge inn familien
• Legger du et barn til noen som har ektefelle, kobler du det til begge foreldrene med ett trykk.
• Marker en person som død, selv om du ikke kjenner dødsdatoen.
• Bryllups- og skilsmissedato kan nå endres når som helst — trykk på blyanten ved ektefellen. Bryllupsdatoen kan du også sette med én gang når du legger til en ektefelle.
• Bedre personsøk når du oppretter en relasjon — søkefeltet ligger alltid øverst, med treffene under.
• Samme datovelger i hele appen.
```

### 🇸🇪 Svenska

```
Lättare att lägga in familjen
• När du lägger till ett barn till någon som har en partner kopplar du det till båda föräldrarna med ett tryck.
• Markera en person som avliden, även när du inte vet dödsdatumet.
• Bröllops- och skilsmässodatum går nu att ändra när som helst — tryck på pennan vid partnern. Bröllopsdatumet kan du också ange direkt när du lägger till en partner.
• Skönare personsökning när du skapar en relation — sökfältet ligger alltid högst upp med träffarna under.
• Samma datumväljare i hela appen.
```

### 🇩🇰 Dansk

```
Nemmere at indtaste familien
• Når du tilføjer et barn til en person med ægtefælle, kobler du det til begge forældre med ét tryk.
• Markér en person som død, også når du ikke kender dødsdatoen.
• Bryllups- og skilsmissedato kan nu redigeres når som helst — tryk på blyanten ved ægtefællen. Bryllupsdatoen kan du også angive med det samme, når du tilføjer en ægtefælle.
• Bedre personsøgning når du opretter en relation — søgefeltet ligger altid øverst med resultaterne under.
• Samme datovælger i hele appen.
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
