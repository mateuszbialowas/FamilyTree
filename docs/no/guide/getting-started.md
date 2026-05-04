# Kom i gang

## Forutsetninger

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS-simulator (macOS) eller Android-emulator

## Installasjon

```bash
# Klon repositoryet
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Installer avhengigheter
npm install
```

## Kjøre appen

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

Trykk deretter `i` for iOS eller `a` for Android.

## Prosjektoppsett

Prosjektet bruker Expo med New Architecture aktivert. Etter kloning er ingen ekstra konfigurasjon nødvendig — bare installer avhengigheter og kjør.

Hvis du endrer native konfigurasjon (f.eks. bundle-ID, tillatelser), regenerer native prosjekter:

```bash
npx expo prebuild --clean
```
