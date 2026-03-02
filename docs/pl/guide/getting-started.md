# Rozpoczęcie pracy

## Wymagania

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Symulator iOS (macOS) lub Emulator Android

## Instalacja

```bash
# Sklonuj repozytorium
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Zainstaluj zależności
npm install
```

## Uruchamianie aplikacji

### Symulator iOS

```bash
npx expo run:ios
```

### Emulator Android

```bash
npx expo run:android
```

### Serwer deweloperski Expo

```bash
npm start
```

Następnie naciśnij `i` dla iOS lub `a` dla Androida.

## Konfiguracja projektu

Projekt używa Expo z włączoną Nową Architekturą. Po sklonowaniu nie jest wymagana dodatkowa konfiguracja — wystarczy zainstalować zależności i uruchomić.

Jeśli zmienisz natywną konfigurację (np. bundle ID, uprawnienia), wygeneruj ponownie projekty natywne:

```bash
npx expo prebuild --clean
```
