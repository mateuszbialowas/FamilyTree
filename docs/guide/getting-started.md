# Getting Started

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- iOS Simulator (macOS) or Android Emulator

## Installation

```bash
# Clone the repository
git clone https://github.com/mateuszbialowas/FamilyTree.git
cd FamilyTree

# Install dependencies
npm install
```

## Running the App

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

Then press `i` for iOS or `a` for Android.

## Project Setup

The project uses Expo with the New Architecture enabled. After cloning, no additional configuration is needed — just install dependencies and run.

If you change native configuration (e.g., bundle ID, permissions), regenerate native projects:

```bash
npx expo prebuild --clean
```
