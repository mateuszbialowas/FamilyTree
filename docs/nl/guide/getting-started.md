# Aan de slag

## Vereisten

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) of Android Emulator

## Installatie

```bash
# Clone de repository
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Installeer dependencies
npm install
```

## De app uitvoeren

### iOS Simulator

```bash
npx expo run:ios
```

### Android Emulator

```bash
npx expo run:android
```

### Expo Dev Server

```bash
npm start
```

Druk dan op `i` voor iOS of `a` voor Android.

## Projectinstelling

Het project gebruikt Expo met de New Architecture ingeschakeld. Na het clonen is geen extra configuratie nodig — installeer gewoon dependencies en start.

Als u native configuratie wijzigt (bijv. bundle ID, machtigingen), regenereer dan native projecten:

```bash
npx expo prebuild --clean
```
