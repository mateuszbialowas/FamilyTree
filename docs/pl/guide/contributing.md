# Współpraca

Dziękujemy za zainteresowanie współpracą nad FamilyTree!

## Rozpoczęcie

1. Zforkuj repozytorium
2. Sklonuj swojego forka: `git clone https://github.com/TWOJ_LOGIN/FamilyTree.git`
3. Zainstaluj zależności: `npm install`
4. Utwórz gałąź: `git checkout -b feature/twoja-funkcja`

## Przebieg pracy

1. Wprowadź zmiany
2. Przetestuj na symulatorach iOS i Android
3. Uruchom testy E2E: `npm run test:e2e`
4. Zatwierdź zmiany z opisowym komunikatem
5. Wypchnij i otwórz Pull Request

## Styl kodu

- TypeScript jest używany w całym projekcie — unikaj typów `any`
- Stosuj istniejące wzorce dla komponentów i ekranów
- Używaj scentralizowanego motywu (`src/theme/`) dla kolorów, czcionek i odstępów
- Tekst UI musi być po polsku (język aplikacji)

## Dodawanie nowego ekranu

1. Utwórz ekran w `src/screens/`
2. Dodaj go do odpowiedniego stosu nawigacji w `src/navigation/`
3. Dodaj test E2E Maestro w `.maestro/`

## Zgłaszanie problemów

Otwórz issue na GitHubie z:

- Jasnym opisem problemu
- Krokami do odtworzenia
- Oczekiwanym vs. rzeczywistym zachowaniem
- Informacjami o urządzeniu/symulatorze

## Licencja

Współpracując, zgadzasz się, że Twoje wkłady będą licencjonowane na licencji MIT.
