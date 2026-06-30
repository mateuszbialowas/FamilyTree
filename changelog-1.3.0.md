# FamilyTree 1.3.0

_Data: 2026-07-01_

Wersja aplikacji: **1.3.0** (build number inkrementowany automatycznie przez EAS — `production.autoIncrement: true`, `appVersionSource: remote`).

---

## 📱 App Store Connect — „Co nowego" (do wklejenia)

### 🇵🇱 Polski

```
Kolejność rodzeństwa
• Rodzeństwo układa się teraz automatycznie od najstarszego (po lewej) do najmłodszego (po prawej) — wystarczy wpisać daty urodzenia.
• Kolejność możesz też zmienić ręcznie: przytrzymaj osobę na drzewie i użyj strzałek. Aplikacja podpowie, gdy danego węzła nie da się przesunąć (np. korzeń), żeby nie tworzyć skrzyżowań gałęzi.

Wygodniejsze przeglądanie dużych rodzin
• Nowy przycisk „dopasuj całe drzewo do ekranu" i większe oddalenie — całe drzewo na raz.
• Płynniejszy zoom dwoma palcami — koniec przeskoków przy odrywaniu jednego palca.
• Większy obszar dotyku: przytrzymanie działa też na karcie z opisem, nie tylko na kółku.

Szybciej i ładniej
• Znacznie lepsza wydajność przy dużych drzewach — płynne przeglądanie i przesuwanie kolejności.
• Odświeżone menu osoby i przerysowana wiewiórka.
```

### 🇬🇧 English

```
Sibling order
• Siblings now line up automatically from oldest (left) to youngest (right) — just add their birth dates.
• You can also reorder them by hand: long-press a person on the tree and use the arrows. The app tells you when a node can't move (e.g. the root) so branches never cross.

Easier browsing of large families
• New "fit the whole tree to screen" button and further zoom-out — see everything at once.
• Smoother two-finger zoom — no more jump when you lift one finger.
• Bigger tap target: long-press now works on the label card, not just the circle.

Faster and prettier
• Much better performance on large trees — smooth panning and reordering.
• Refreshed person menu and a redesigned squirrel.
```

---

## 🛠️ Pełna lista zmian (techniczna)

### Nowe funkcje
- **Kolejność rodzeństwa wg daty urodzenia** (lewo→prawo). Bez daty — kolejność wpisywania. Wspólny komparator `compareSiblings` używany przez układ i reduktor.
- **Ręczna zmiana kolejności** przez `REORDER_SIBLING` + pole `Person.manualOrder`. Panel kontekstowy po długim przytrzymaniu węzła (strzałki ◀ ▶, pasek kropek z podświetleniem bieżącej osoby, licznik „X / Y", puls feedbacku).
- **Walidacja przesunięcia** (`isNodeReorderable`): jeśli ruch nie zmieni drzewa (np. korzeń-para przypięty do skraju), panel pokazuje komunikat „zablokowane" zamiast strzałek, które nic nie robią. Liczona raz przy otwarciu menu.
- **„Dopasuj całe drzewo do ekranu"** — nowy przycisk liczący ramkę wszystkich węzłów i dobierający zoom; obok przycisku „wróć do korzenia".

### Poprawki
- **Pinch-to-zoom**: przepisany na przyrostowe delty z wykrywaniem zmiany liczby palców (`numberOfPointers`) — brak przeskoku przy odrywaniu jednego palca.
- **Większe oddalenie**: dolny limit zoomu obniżony (0.3 → 0.08).
- **Obszar dotyku**: długie przytrzymanie i tap działają też na karcie opisu pod kółkiem (`labelCardBounds` współdzielony przez hit-test i rysowanie).
- **Układ przy korzeniu-parze**: rodzeństwo korzenia rysowane po właściwej stronie i w poprawnej kolejności (naprawa odbicia po lewej stronie + zgodność menu z drzewem).
- **Wiewiórka** narysowana od nowa (lepsze proporcje: zgrabny puszysty ogon, większa głowa, wyraźne oko).
- **Menu osoby** przeprojektowane: akcje „dodaj…" na górze (najczęstsze), kolejność rodzeństwa w wyciszonej stopce, uchwyt panelu.

### Wydajność (duże drzewa, np. 120+ osób)
- **Animacje otoczenia** (wiatr/liście/mruganie/poświata) wyłączane powyżej 45 węzłów — w bezruchu zero przerysowań.
- **Cache etykiet** (paragrafy Skia) per‑osoba wg tekstu — reorder nie odbudowuje ~480 paragrafów.
- **Cache ścieżek liści** na poziomie modułu (kwantyzacja rozmiaru) — koniec ~9000 tworzeń ścieżek na render.
- **Cache geometrii gałęzi** wg pozycji+seed.
- **`React.memo` na gałęziach** — reorder przerysowuje tylko gałęzie, które faktycznie się przesunęły; reszta (z pełnym listowiem) pomijana.

### Inne
- Tłumaczenia nowych tekstów we wszystkich 7 językach (pl, en, de, nl, no, sv, da).
- Walidacja importu dopuszcza opcjonalne `manualOrder`.
- Plik danych demo `demo-rodzina-120.json` (120 osób, nazwiska panieńskie, daty, zawody) do testów dużych drzew.
- Testy jednostkowe: kolejność rodzeństwa, reduktor `REORDER_SIBLING`, walidacja `isNodeReorderable`, niezmienniki układu (brak nachodzeń/przecięć).

---

## 🚀 Deploy (kroki)

> Build number jest inkrementowany automatycznie przez EAS — nie trzeba go ustawiać ręcznie.

```bash
# 1. Zatwierdź bump wersji
git add app.json package.json changelog-1.3.0.md
git commit -m "Release 1.3.0"

# 2. Build produkcyjny iOS (EAS, w chmurze)
eas build --platform ios --profile production

# 3. Wyślij do App Store Connect
eas submit --platform ios --latest
```

4. W **App Store Connect** utwórz nową wersję **1.3.0**, wklej notatki „Co nowego" (sekcja wyżej) i podepnij nowy build.
