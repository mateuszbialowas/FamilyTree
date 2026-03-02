# Funkcje

## Wizualizacja drzewa rodzinnego

Widok drzewa renderuje organiczne, ręcznie rysowane drzewo rodzinne za pomocą `@shopify/react-native-skia`. Gałęzie naturalnie zwężają się od grubych pni do cienkich końcówek, z małymi zwierzętami (sowami) siedzącymi na gałęziach.

- Szczypanie do powiększania i przesuwanie po drzewie
- Dotknięcie węzła, aby zobaczyć szczegóły osoby
- Wybór osoby głównej, aby wyśrodkować drzewo

## Zarządzanie osobami

- Dodawanie członków rodziny z imieniem, nazwiskiem, nazwiskiem panieńskim, datą urodzenia i datą śmierci
- Inicjały osoby wyświetlane jako awatary w całej aplikacji
- Zmarli członkowie oznaczeni kirem na drzewie

## Relacje

Definiowanie relacji między osobami:

- **Rodzic–Dziecko** — automatycznie wnioskuje dziadków, pradziadków itd.
- **Małżeństwo** — z opcjonalną datą ślubu
- **Rodzeństwo** — wnioskowane ze wspólnych rodziców

Aplikacja automatycznie oblicza etykiety relacji rozszerzonych (wujek, kuzyn, siostrzeniec itd.).

## Trzy główne zakładki

| Zakładka | Opis |
|----------|------|
| **Drzewo** | Interaktywne płótno drzewa rodzinnego |
| **Lista** | Przeszukiwalna lista wszystkich członków rodziny |
| **Ustawienia** | Import/eksport danych, informacje o aplikacji |

## Import i Eksport

- **Eksport** całych danych rodzinnych jako plik JSON
- **Import** pliku JSON w celu przywrócenia lub scalenia danych
- Udostępnianie eksportów członkom rodziny przez systemowy arkusz udostępniania

## Prywatność

Wszystkie dane są przechowywane lokalnie na urządzeniu za pomocą AsyncStorage. Żadne dane nie są wysyłane na żaden serwer. Szczegóły w [Polityce Prywatności](/pl/privacy-policy).
