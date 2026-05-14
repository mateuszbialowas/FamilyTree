# Mitwirken

Vielen Dank für Ihr Interesse, zu Stammbaum beizutragen!

## Erste Schritte

1. Repository forken
2. Ihren Fork klonen: `git clone https://github.com/IHR_BENUTZERNAME/FamilyTree.git`
3. Abhängigkeiten installieren: `npm install`
4. Branch erstellen: `git checkout -b feature/ihr-feature`

## Entwicklungsablauf

1. Änderungen vornehmen
2. Auf iOS- und Android-Simulatoren testen
3. E2E-Tests ausführen: `npm run test:e2e`
4. Änderungen mit aussagekräftiger Nachricht committen
5. Pushen und Pull Request öffnen

## Code-Stil

- Durchgehend TypeScript — `any`-Typen vermeiden
- Bestehende Muster für Komponenten und Bildschirme befolgen
- Zentrales Theme (`src/theme/`) für Farben, Schriftarten und Abstände verwenden
- UI-Text muss auf Polnisch sein (Sprache der App)

## Neuen Bildschirm hinzufügen

1. Bildschirm in `src/screens/` erstellen
2. Zum entsprechenden Navigationsstack in `src/navigation/` hinzufügen
3. Maestro-E2E-Test in `.maestro/` hinzufügen

## Probleme melden

Bitte öffnen Sie ein Issue auf GitHub mit:

- Klarer Beschreibung des Problems
- Schritten zur Reproduktion
- Erwartetem vs. tatsächlichem Verhalten
- Geräte-/Simulator-Info

## Lizenz

Mit Ihrem Beitrag erklären Sie sich damit einverstanden, dass Ihre Beiträge unter der MIT-Lizenz lizenziert werden.
