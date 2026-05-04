# Kom godt i gang

## Forudsætninger

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS-simulator (macOS) eller Android-emulator

## Installation

```bash
# Klon repositoryet
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Installer afhængigheder
npm install
```

## Kør appen

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

Tryk derefter `i` for iOS eller `a` for Android.

## Projektopsætning

Projektet bruger Expo med New Architecture aktiveret. Efter klon kræves ingen yderligere konfiguration — installer bare afhængigheder og kør.

Hvis du ændrer native konfiguration (f.eks. bundle-ID, tilladelser), regenerer native projekter:

```bash
npx expo prebuild --clean
```
