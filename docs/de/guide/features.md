# Funktionen

## Stammbaum-Visualisierung

Die Stammbaumansicht rendert einen organischen, handgezeichneten Familienstammbaum mit `@shopify/react-native-skia`. Äste verjüngen sich natürlich von dicken Stämmen zu dünnen Spitzen, mit kleinen Tieren (Eulen) auf den Ästen für eine charmante Note.

- Zoomen mit Geste, Schwenken zum Navigieren
- Tippen Sie auf einen Knoten, um Personendetails anzuzeigen
- Wählen Sie eine Stammperson aus, um den Baum neu zu zentrieren

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/de/tree.png" alt="Stammbaumansicht — Nachkommen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/de/tree-zoomed-out.png" alt="Stammbaumansicht — Vorfahren" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Personenverwaltung

- Familienmitglieder mit Vorname, Nachname, Geburtsname, Geburtsdatum und Sterbedatum hinzufügen
- Initialen werden in der gesamten App als Avatare angezeigt
- Verstorbene Mitglieder werden mit einem Trauerband im Baum angezeigt

<div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin: 24px 0;">
  <img src="/screenshots/de/list.png" alt="Personenliste" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
  <img src="/screenshots/de/person-detail.png" alt="Personendetails" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Beziehungen

Definieren Sie Beziehungen zwischen Personen:

- **Eltern–Kind** — leitet automatisch Großeltern, Urgroßeltern usw. ab
- **Ehe** — mit optionalem Hochzeitsdatum
- **Geschwister** — abgeleitet von gemeinsamen Eltern

Die App berechnet erweiterte Beziehungsbezeichnungen (Onkel, Cousin, Neffe usw.) automatisch.

## Drei Hauptregisterkarten

| Registerkarte | Beschreibung |
|-----|-------------|
| **Drzewo** (Baum) | Interaktiver Stammbaum-Canvas |
| **Lista** (Liste) | Durchsuchbare Liste aller Familienmitglieder |
| **Ustawienia** (Einstellungen) | Daten importieren/exportieren, App-Info |

## Import & Export

- **Exportieren** Sie Ihre gesamten Familiendaten als JSON-Datei
- **Importieren** Sie eine JSON-Datei zum Wiederherstellen oder Zusammenführen
- Teilen Sie Exporte mit Familienmitgliedern über das System-Teilen-Menü

<div style="display: flex; gap: 16px; justify-content: center; margin: 24px 0;">
  <img src="/screenshots/de/settings.png" alt="Einstellungen" style="max-height: 420px; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,0.12);" />
</div>

## Datenschutz

Alle Daten werden lokal auf dem Gerät über AsyncStorage gespeichert. Es werden keine Daten an einen Server gesendet. Details finden Sie in der [Datenschutzerklärung](/de/privacy-policy).
