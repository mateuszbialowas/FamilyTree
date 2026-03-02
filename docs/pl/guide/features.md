# Funkcje

## Wizualizacja drzewa rodzinnego

Widok drzewa renderuje organiczne, ręcznie rysowane drzewo rodzinne za pomocą `@shopify/react-native-skia`. Gałęzie naturalnie zwężają się od grubych pni do cienkich końcówek, z małymi zwierzętami (sowami) siedzącymi na gałęziach.

- Szczypanie do powiększania i przesuwanie po drzewie
- Dotknięcie węzła, aby zobaczyć szczegóły osoby
- Wybór osoby głównej, aby wyśrodkować drzewo

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/tree.png" alt="Widok drzewa — potomkowie" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/tree-ancestors.png" alt="Widok drzewa — przodkowie" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Zarządzanie osobami

- Dodawanie członków rodziny z imieniem, nazwiskiem, nazwiskiem panieńskim, datą urodzenia i datą śmierci
- Inicjały osoby wyświetlane jako awatary w całej aplikacji
- Zmarli członkowie oznaczeni kirem na drzewie

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/list.png" alt="Lista osób" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail.png" alt="Szczegóły osoby" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/detail2.png" alt="Szczegóły osoby z relacjami" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Relacje

Definiowanie relacji między osobami:

- **Rodzic–Dziecko** — automatycznie wnioskuje dziadków, pradziadków itd.
- **Małżeństwo** — z opcjonalną datą ślubu
- **Rodzeństwo** — wnioskowane ze wspólnych rodziców

Aplikacja automatycznie oblicza etykiety relacji rozszerzonych (wujek, kuzyn, siostrzeniec itd.).

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/add-relationship.png" alt="Ekran dodawania relacji" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

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

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/settings.png" alt="Ekran ustawień" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Prywatność

Wszystkie dane są przechowywane lokalnie na urządzeniu za pomocą AsyncStorage. Żadne dane nie są wysyłane na żaden serwer. Szczegóły w [Polityce Prywatności](/pl/privacy-policy).
