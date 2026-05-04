# Kom igång

## Förutsättningar

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS-simulator (macOS) eller Android-emulator

## Installation

```bash
# Klona repositoryt
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Installera beroenden
npm install
```

## Köra appen

### iOS-simulator

```bash
npx expo run:ios
```

### Android-emulator

```bash
npx expo run:android
```

### Expo Dev Server

```bash
npm start
```

Tryck sedan `i` för iOS eller `a` för Android.

## Projektinställning

Projektet använder Expo med New Architecture aktiverat. Efter kloning behövs ingen ytterligare konfiguration — installera bara beroenden och kör.

Om du ändrar inhemsk konfiguration (t.ex. bundle-ID, behörigheter), regenerera inhemska projekt:

```bash
npx expo prebuild --clean
```
