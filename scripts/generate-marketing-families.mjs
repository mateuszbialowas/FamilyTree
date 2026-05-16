#!/usr/bin/env node
/**
 * Generate the 7 marketing-only sample families used to capture App Store
 * screenshots. Each tree has 16 people across 4 generations centered on
 * "me", with locale-appropriate names, surnames, places and notes.
 *
 * Output: assets/marketing-families/<locale>.json (7 files)
 *
 * IDs and the parent-child / marriage skeleton are identical across
 * locales — only the per-person string data changes.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT_DIR = join(ROOT, 'assets/marketing-families');

// Birth/death/marriage dates shared across locales. Indexed by the
// person key (see KEYS below). null deathDate ⇒ alive.
const DATES = {
  // Generation 1 — great-grandparents (born ~1895-1908, all deceased).
  // Only the OUTER couples are kept: paternal-paternal (Józef line) and
  // maternal-maternal (Kazimierz line). Adding all 4 great-grandparent
  // couples breaks the layout — the inner couples (Antoni+Janina,
  // Stefan+Helena) collide with the existing couples' visual space
  // because grandparents Władysław+Krystyna and Andrzej+Halina are
  // tight pairs (80px apart) and their parents can't both center above
  // them without overlap. See treeLayout.ts overlap resolution.
  'gp-pp-h': { b: '1898-03-14', d: '1968-11-02' },
  'gp-pp-w': { b: '1902-07-22', d: '1975-04-18' },
  'gp-mm-h': { b: '1899-02-06', d: '1969-09-15' },
  'gp-mm-w': { b: '1908-04-21', d: '1985-01-08' },
  // Generation 2 — grandparents (born ~1927-1940; 3 deceased, 1 alive)
  'g-p-h':   { b: '1927-06-10', d: '2010-02-25' },
  'g-p-w':   { b: '1930-10-03', d: '2015-07-19' },
  'g-m-h':   { b: '1932-12-15', d: '2018-05-08' },
  'g-m-w':   { b: '1940-08-27', d: null }, // alive — "grandma you can still call"
  // Generation 3 — parents (alive)
  'parent-f': { b: '1958-04-02', d: null },
  'parent-m': { b: '1962-09-14', d: null },
  // Generation 4 — me + sibling (alive)
  'me':       { b: '1989-07-19', d: null },
  'sibling':  { b: '1992-11-30', d: null },
};

// Marriage dates shared across locales.
const MARRIAGES = [
  { id: 'm-01', a: 'gp-pp-h', b: 'gp-pp-w', date: '1923-05-12' },
  { id: 'm-02', a: 'gp-mm-h', b: 'gp-mm-w', date: '1928-08-17' },
  { id: 'm-03', a: 'g-p-h',   b: 'g-p-w',   date: '1952-04-26' },
  { id: 'm-04', a: 'g-m-h',   b: 'g-m-w',   date: '1959-07-11' },
  { id: 'm-05', a: 'parent-f', b: 'parent-m', date: '1985-06-22' },
];

// Parent-child edges. Each child has both parents (where both are in
// the tree). Krystyna and Andrzej have no parents shown — see DATES
// comment for why.
const PC = [
  // Gen 1 → Gen 2 (only outer-couple parents are in the tree)
  { c: 'g-p-h', parents: ['gp-pp-h', 'gp-pp-w'] },
  { c: 'g-m-w', parents: ['gp-mm-h', 'gp-mm-w'] },
  // Gen 2 → Gen 3
  { c: 'parent-f', parents: ['g-p-h', 'g-p-w'] },
  { c: 'parent-m', parents: ['g-m-h', 'g-m-w'] },
  // Gen 3 → Gen 4
  { c: 'me', parents: ['parent-f', 'parent-m'] },
  { c: 'sibling', parents: ['parent-f', 'parent-m'] },
];

const GENDER = {
  'gp-pp-h': 'male',   'gp-pp-w': 'female',
  'gp-mm-h': 'male',   'gp-mm-w': 'female',
  'g-p-h':   'male',   'g-p-w':   'female',
  'g-m-h':   'male',   'g-m-w':   'female',
  'parent-f': 'male',  'parent-m': 'female',
  'me': 'male',        'sibling': 'female',
};

// 12 keys in the order they appear in the people array.
const KEYS = [
  'me', 'sibling',
  'parent-f', 'parent-m',
  'g-p-h', 'g-p-w', 'g-m-h', 'g-m-w',
  'gp-pp-h', 'gp-pp-w',
  'gp-mm-h', 'gp-mm-w',
];

// Per-locale data. Each entry maps a person key → { firstName, lastName, notes }.
// Note prefixes ("née ...") use the locale-appropriate phrasing.
const LOCALES = {
  pl: {
    'me':       { f: 'Mateusz',     l: 'Kowalski',     n: 'Programista z Krakowa. Pasjonat genealogii i fotografii.' },
    'sibling':  { f: 'Aleksandra',  l: 'Kowalska',     n: 'Projektantka graficzna. Mieszka we Wrocławiu.' },
    'parent-f': { f: 'Marek',       l: 'Kowalski',     n: 'Inżynier budownictwa, pracował przy budowie obwodnicy Krakowa.' },
    'parent-m': { f: 'Ewa',         l: 'Kowalska',     n: 'Z domu Nowak. Nauczycielka języka polskiego.' },
    'g-p-h':    { f: 'Władysław',   l: 'Kowalski',     n: 'Księgowy. Mieszkał całe życie w Krakowie. Lubił szachy.' },
    'g-p-w':    { f: 'Krystyna',    l: 'Kowalska',     n: 'Z domu Wójcik. Pielęgniarka w szpitalu Narutowicza.' },
    'g-m-h':    { f: 'Andrzej',     l: 'Nowak',        n: 'Elektryk. Wyjechał z Warszawy na Śląsk w latach 50.' },
    'g-m-w':    { f: 'Halina',      l: 'Nowak',        n: 'Z domu Lewandowska. Nauczycielka matematyki. Wciąż żyje, mieszka w Katowicach.' },
    'gp-pp-h':  { f: 'Józef',       l: 'Kowalski',     n: 'Kolejarz na trasie Kraków-Lwów. Weteran I wojny.' },
    'gp-pp-w':  { f: 'Stanisława',  l: 'Kowalska',     n: 'Z domu Maliszewska. Krawcowa.' },
    'gp-pm-h':  { f: 'Antoni',      l: 'Wójcik',       n: 'Rolnik spod Tarnowa.' },
    'gp-pm-w':  { f: 'Janina',      l: 'Wójcik',       n: 'Z domu Kamińska. Gospodyni, śpiewała w chórze parafialnym.' },
    'gp-mp-h':  { f: 'Stefan',      l: 'Nowak',        n: 'Szewc w Warszawie. Zginął na Powstaniu Warszawskim.' },
    'gp-mp-w':  { f: 'Helena',      l: 'Nowak',        n: 'Z domu Pawlak. Szwaczka.' },
    'gp-mm-h':  { f: 'Kazimierz',   l: 'Lewandowski',  n: 'Listonosz w Łodzi.' },
    'gp-mm-w':  { f: 'Władysława',  l: 'Lewandowska',  n: 'Z domu Zielińska. Nauczycielka wiejska.' },
  },
  en: {
    'me':       { f: 'Michael',   l: 'Smith',   n: 'Software engineer from Manchester. Keen on genealogy and photography.' },
    'sibling':  { f: 'Emma',      l: 'Smith',   n: 'Graphic designer. Lives in Bristol.' },
    'parent-f': { f: 'Robert',    l: 'Smith',   n: 'Civil engineer, worked on the M62 motorway extension.' },
    'parent-m': { f: 'Elizabeth', l: 'Smith',   n: 'Née Wilson. English teacher.' },
    'g-p-h':    { f: 'William',   l: 'Smith',   n: 'Accountant, lived all his life in Manchester. Loved chess.' },
    'g-p-w':    { f: 'Margaret',  l: 'Smith',   n: 'Née Brown. Nurse at Manchester Royal Infirmary.' },
    'g-m-h':    { f: 'George',    l: 'Wilson',  n: 'Electrician. Moved from London to Birmingham in the 1950s.' },
    'g-m-w':    { f: 'Mary',      l: 'Wilson',  n: 'Née Taylor. Maths teacher. Still alive, lives in Birmingham.' },
    'gp-pp-h':  { f: 'Henry',     l: 'Smith',   n: 'Railway worker on the Manchester-Liverpool line. WWI veteran.' },
    'gp-pp-w':  { f: 'Elsie',     l: 'Smith',   n: 'Née Carter. Seamstress.' },
    'gp-pm-h':  { f: 'Thomas',    l: 'Brown',   n: 'Farmer in rural Cheshire.' },
    'gp-pm-w':  { f: 'Edith',     l: 'Brown',   n: 'Née Hill. Homemaker, sang in the parish choir.' },
    'gp-mp-h':  { f: 'Albert',    l: 'Wilson',  n: 'Cobbler in London. Killed during the Blitz.' },
    'gp-mp-w':  { f: 'Florence',  l: 'Wilson',  n: 'Née Davies. Dressmaker.' },
    'gp-mm-h':  { f: 'Frederick', l: 'Taylor',  n: 'Postman in Leeds.' },
    'gp-mm-w':  { f: 'Beatrice',  l: 'Taylor',  n: 'Née Green. Village schoolteacher.' },
  },
  de: {
    'me':       { f: 'Lukas',     l: 'Müller',   n: 'Softwareentwickler aus München. Begeistert für Genealogie und Fotografie.' },
    'sibling':  { f: 'Anna',      l: 'Müller',   n: 'Grafikdesignerin. Lebt in Hamburg.' },
    'parent-f': { f: 'Andreas',   l: 'Müller',   n: 'Bauingenieur, arbeitete am Ausbau der Münchner U-Bahn.' },
    'parent-m': { f: 'Brigitte',  l: 'Müller',   n: 'Geborene Schmidt. Deutschlehrerin.' },
    'g-p-h':    { f: 'Walter',    l: 'Müller',   n: 'Buchhalter, lebte sein ganzes Leben in München. Begeisterter Schachspieler.' },
    'g-p-w':    { f: 'Helga',     l: 'Müller',   n: 'Geborene Fischer. Krankenschwester am Klinikum Großhadern.' },
    'g-m-h':    { f: 'Hans',      l: 'Schmidt',  n: 'Elektriker. Zog in den 50er Jahren von Berlin nach Stuttgart.' },
    'g-m-w':    { f: 'Ingrid',    l: 'Schmidt',  n: 'Geborene Weber. Mathematiklehrerin. Lebt noch, wohnt in Stuttgart.' },
    'gp-pp-h':  { f: 'Friedrich', l: 'Müller',   n: 'Eisenbahner auf der Strecke München-Salzburg. Veteran des 1. Weltkriegs.' },
    'gp-pp-w':  { f: 'Marta',     l: 'Müller',   n: 'Geborene Hoffmann. Schneiderin.' },
    'gp-pm-h':  { f: 'Karl',      l: 'Fischer',  n: 'Bauer im Allgäu.' },
    'gp-pm-w':  { f: 'Käthe',     l: 'Fischer',  n: 'Geborene Wagner. Hausfrau, sang im Kirchenchor.' },
    'gp-mp-h':  { f: 'Otto',      l: 'Schmidt',  n: 'Schuhmacher in Berlin. Fiel im 2. Weltkrieg.' },
    'gp-mp-w':  { f: 'Anneliese', l: 'Schmidt',  n: 'Geborene Becker. Näherin.' },
    'gp-mm-h':  { f: 'Heinrich',  l: 'Weber',    n: 'Briefträger in Leipzig.' },
    'gp-mm-w':  { f: 'Gertrude',  l: 'Weber',    n: 'Geborene Schulz. Dorfschullehrerin.' },
  },
  nl: {
    'me':       { f: 'Daan',      l: 'de Vries',  n: 'Software­ontwikkelaar uit Utrecht. Liefhebber van genealogie en fotografie.' },
    'sibling':  { f: 'Sophie',    l: 'de Vries',  n: 'Grafisch ontwerper. Woont in Amsterdam.' },
    'parent-f': { f: 'Pieter',    l: 'de Vries',  n: 'Civiel ingenieur, werkte aan de A2-uitbreiding.' },
    'parent-m': { f: 'Margriet',  l: 'de Vries',  n: 'Geboren Jansen. Lerares Nederlands.' },
    'g-p-h':    { f: 'Jan',       l: 'de Vries',  n: 'Boekhouder, woonde zijn hele leven in Utrecht. Hield van schaken.' },
    'g-p-w':    { f: 'Wilhelmina', l: 'de Vries', n: 'Geboren Jansen. Verpleegster in het UMC.' },
    'g-m-h':    { f: 'Hendrik',   l: 'Bakker',    n: 'Elektricien. Verhuisde in de jaren 50 van Amsterdam naar Rotterdam.' },
    'g-m-w':    { f: 'Maria',     l: 'Bakker',    n: 'Geboren Visser. Wiskundelerares. Leeft nog, woont in Rotterdam.' },
    'gp-pp-h':  { f: 'Cornelis',  l: 'de Vries',  n: 'Spoorwegarbeider op het traject Utrecht-Arnhem. Veteraan van WO I.' },
    'gp-pp-w':  { f: 'Johanna',   l: 'de Vries',  n: 'Geboren Smit. Naaister.' },
    'gp-pm-h':  { f: 'Willem',    l: 'Jansen',    n: 'Boer in de Betuwe.' },
    'gp-pm-w':  { f: 'Anna',      l: 'Jansen',    n: 'Geboren Mulder. Huisvrouw, zong in het kerkkoor.' },
    'gp-mp-h':  { f: 'Albertus',  l: 'Bakker',    n: 'Schoenmaker in Amsterdam. Omgekomen tijdens WO II.' },
    'gp-mp-w':  { f: 'Geertruida', l: 'Bakker',   n: 'Geboren de Wit. Kleermaakster.' },
    'gp-mm-h':  { f: 'Jacobus',   l: 'Visser',    n: 'Postbode in Den Haag.' },
    'gp-mm-w':  { f: 'Maartje',   l: 'Visser',    n: 'Geboren van Dijk. Dorpsschoolfrouw.' },
  },
  no: {
    'me':       { f: 'Magnus',    l: 'Hansen',   n: 'Programvareutvikler fra Bergen. Interessert i slektsforskning og fotografi.' },
    'sibling':  { f: 'Emma',      l: 'Hansen',   n: 'Grafisk designer. Bor i Oslo.' },
    'parent-f': { f: 'Ole',       l: 'Hansen',   n: 'Bygningsingeniør, jobbet på utvidelsen av E39.' },
    'parent-m': { f: 'Sigrid',    l: 'Hansen',   n: 'Født Olsen. Norsklærer.' },
    'g-p-h':    { f: 'Per',       l: 'Hansen',   n: 'Regnskapsfører, bodde hele livet i Bergen. Glad i sjakk.' },
    'g-p-w':    { f: 'Astrid',    l: 'Hansen',   n: 'Født Olsen. Sykepleier ved Haukeland sykehus.' },
    'g-m-h':    { f: 'Knut',      l: 'Larsen',   n: 'Elektriker. Flyttet fra Oslo til Trondheim på 50-tallet.' },
    'g-m-w':    { f: 'Ingrid',    l: 'Larsen',   n: 'Født Berg. Mattelærer. Lever fortsatt, bor i Trondheim.' },
    'gp-pp-h':  { f: 'Anders',    l: 'Hansen',   n: 'Jernbanearbeider på Bergensbanen. Veteran fra 1. verdenskrig.' },
    'gp-pp-w':  { f: 'Karoline',  l: 'Hansen',   n: 'Født Johansen. Syerske.' },
    'gp-pm-h':  { f: 'Bjørn',     l: 'Olsen',    n: 'Bonde i Hardanger.' },
    'gp-pm-w':  { f: 'Margit',    l: 'Olsen',    n: 'Født Strand. Husmor, sang i menighetskoret.' },
    'gp-mp-h':  { f: 'Sigurd',    l: 'Larsen',   n: 'Skomaker i Oslo. Omkom under 2. verdenskrig.' },
    'gp-mp-w':  { f: 'Helga',     l: 'Larsen',   n: 'Født Nilsen. Dressmaker.' },
    'gp-mm-h':  { f: 'Tor',       l: 'Berg',     n: 'Postbud i Stavanger.' },
    'gp-mm-w':  { f: 'Solveig',   l: 'Berg',     n: 'Født Bakke. Bygdeskolelærer.' },
  },
  sv: {
    'me':       { f: 'Erik',      l: 'Andersson', n: 'Mjukvaru­utvecklare från Göteborg. Intresserad av släktforskning och fotografi.' },
    'sibling':  { f: 'Astrid',    l: 'Andersson', n: 'Grafisk formgivare. Bor i Stockholm.' },
    'parent-f': { f: 'Anders',    l: 'Andersson', n: 'Civilingenjör, arbetade med utbyggnaden av E6.' },
    'parent-m': { f: 'Karin',     l: 'Andersson', n: 'Född Johansson. Svensklärare.' },
    'g-p-h':    { f: 'Lars',      l: 'Andersson', n: 'Revisor, bodde hela sitt liv i Göteborg. Tyckte om schack.' },
    'g-p-w':    { f: 'Margareta', l: 'Andersson', n: 'Född Johansson. Sjuksköterska på Sahlgrenska sjukhuset.' },
    'g-m-h':    { f: 'Sven',      l: 'Karlsson',  n: 'Elektriker. Flyttade från Stockholm till Malmö på 50-talet.' },
    'g-m-w':    { f: 'Ingrid',    l: 'Karlsson',  n: 'Född Lindberg. Mattelärare. Lever ännu, bor i Malmö.' },
    'gp-pp-h':  { f: 'Gustav',    l: 'Andersson', n: 'Järnvägsarbetare på linjen Göteborg-Stockholm. Veteran från första världskriget.' },
    'gp-pp-w':  { f: 'Elin',      l: 'Andersson', n: 'Född Persson. Sömmerska.' },
    'gp-pm-h':  { f: 'Karl',      l: 'Johansson', n: 'Bonde i Västergötland.' },
    'gp-pm-w':  { f: 'Anna',      l: 'Johansson', n: 'Född Eriksson. Hemmafru, sjöng i kyrkokören.' },
    'gp-mp-h':  { f: 'Olof',      l: 'Karlsson',  n: 'Skomakare i Stockholm. Omkom under andra världskriget.' },
    'gp-mp-w':  { f: 'Hilda',     l: 'Karlsson',  n: 'Född Larsson. Klänningssömmerska.' },
    'gp-mm-h':  { f: 'Nils',      l: 'Lindberg',  n: 'Brevbärare i Uppsala.' },
    'gp-mm-w':  { f: 'Maria',     l: 'Lindberg',  n: 'Född Bergström. Byskollärare.' },
  },
  da: {
    'me':       { f: 'Mads',      l: 'Jensen',    n: 'Softwareudvikler fra Aarhus. Interesseret i slægtsforskning og fotografering.' },
    'sibling':  { f: 'Freja',     l: 'Jensen',    n: 'Grafisk designer. Bor i København.' },
    'parent-f': { f: 'Søren',     l: 'Jensen',    n: 'Bygningsingeniør, arbejdede på udvidelsen af motorvejen ved Aarhus.' },
    'parent-m': { f: 'Lise',      l: 'Jensen',    n: 'Født Nielsen. Dansklærer.' },
    'g-p-h':    { f: 'Henrik',    l: 'Jensen',    n: 'Revisor, boede hele sit liv i Aarhus. Glad for skak.' },
    'g-p-w':    { f: 'Kirsten',   l: 'Jensen',    n: 'Født Nielsen. Sygeplejerske på Aarhus Universitetshospital.' },
    'g-m-h':    { f: 'Niels',     l: 'Hansen',    n: 'Elektriker. Flyttede fra København til Odense i 50’erne.' },
    'g-m-w':    { f: 'Anne',      l: 'Hansen',    n: 'Født Pedersen. Matematiklærer. Lever endnu, bor i Odense.' },
    'gp-pp-h':  { f: 'Christian', l: 'Jensen',    n: 'Jernbanearbejder på linjen Aarhus-Aalborg. Veteran fra 1. verdenskrig.' },
    'gp-pp-w':  { f: 'Inger',     l: 'Jensen',    n: 'Født Larsen. Syerske.' },
    'gp-pm-h':  { f: 'Hans',      l: 'Nielsen',   n: 'Landmand på Djursland.' },
    'gp-pm-w':  { f: 'Else',      l: 'Nielsen',   n: 'Født Christensen. Husmor, sang i kirkekoret.' },
    'gp-mp-h':  { f: 'Peder',     l: 'Hansen',    n: 'Skomager i København. Omkom under 2. verdenskrig.' },
    'gp-mp-w':  { f: 'Kirsten',   l: 'Hansen',    n: 'Født Madsen. Skrædder.' },
    'gp-mm-h':  { f: 'Anders',    l: 'Pedersen',  n: 'Postbud i Aalborg.' },
    'gp-mm-w':  { f: 'Margrethe', l: 'Pedersen',  n: 'Født Mortensen. Landsbyskolelærer.' },
  },
};

function buildFamily(locale) {
  const names = LOCALES[locale];
  const people = KEYS.map((k) => ({
    id: `p-${k}`,
    firstName: names[k].f,
    lastName: names[k].l,
    gender: GENDER[k],
    birthDate: DATES[k].b,
    deathDate: DATES[k].d,
    notes: names[k].n,
  }));

  const parentChildRelationships = [];
  let pcId = 1;
  for (const edge of PC) {
    for (const parent of edge.parents) {
      parentChildRelationships.push({
        id: `r-${String(pcId).padStart(2, '0')}`,
        parentId: `p-${parent}`,
        childId: `p-${edge.c}`,
      });
      pcId++;
    }
  }

  const marriages = MARRIAGES.map((m) => ({
    id: m.id,
    spouse1Id: `p-${m.a}`,
    spouse2Id: `p-${m.b}`,
    marriageDate: m.date,
    divorceDate: null,
  }));

  return { people, parentChildRelationships, marriages };
}

mkdirSync(OUT_DIR, { recursive: true });
for (const locale of Object.keys(LOCALES)) {
  const data = buildFamily(locale);
  writeFileSync(
    join(OUT_DIR, `${locale}.json`),
    JSON.stringify(data, null, 2) + '\n',
  );
  console.log(`${locale}: ${data.people.length} people, ${data.parentChildRelationships.length} parent-child, ${data.marriages.length} marriages`);
}
