# Erste Schritte

## Voraussetzungen

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS-Simulator (macOS) oder Android-Emulator

## Installation

```bash
# Repository klonen
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Abhängigkeiten installieren
npm install
```

## App ausführen

### iOS-Simulator

```bash
npx expo run:ios
```

### Android-Emulator

```bash
npx expo run:android
```

### Expo Dev Server

```bash
npm start
```

Drücken Sie dann `i` für iOS oder `a` für Android.

## Projekteinrichtung

Das Projekt verwendet Expo mit aktivierter neuer Architektur. Nach dem Klonen ist keine zusätzliche Konfiguration erforderlich — installieren Sie einfach die Abhängigkeiten und starten Sie.

Wenn Sie die native Konfiguration ändern (z. B. Bundle-ID, Berechtigungen), regenerieren Sie die nativen Projekte:

```bash
npx expo prebuild --clean
```
