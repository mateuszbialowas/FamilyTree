/**
 * Per-locale kinship label dictionaries used by `relationshipLabels.ts`.
 *
 * These live outside the i18next resource bundle because they need real
 * TypeScript functions (e.g., `'Pra'.repeat(greats)`), which i18next
 * resources don't support — i18next is for static interpolation strings.
 *
 * `getKinshipLabels()` reads the current language from the i18next instance
 * so this module follows whatever locale i18next is set to.
 */

import i18n from 'i18next';
import type { Locale } from '../i18n';

export interface KinshipLabels {
  father: string;
  mother: string;
  son: string;
  daughter: string;
  husband: string;
  wife: string;
  brother: string;
  sister: string;
  ancestor(greats: number, female: boolean): string;
  descendant(greats: number, female: boolean): string;
  uncle: string;
  aunt: string;
  nephew(sisterChild: boolean | null): string;
  niece(sisterChild: boolean | null): string;
  cousin(female: boolean): string;
  cousinNumbered(n: number, female: boolean): string;
  fatherInLaw: string;
  motherInLaw: string;
  sonInLaw: string;
  daughterInLaw: string;
  brotherInLaw: string;
  sisterInLaw: string;
  stepfather: string;
  stepmother: string;
  stepson: string;
  stepdaughter: string;
  halfBrother: string;
  halfSister: string;
  spousesGrandfather(greats: number): string;
  spousesGrandmother(greats: number): string;
  spousesUncle: string;
  spousesAunt: string;
  spousesNephew: string;
  spousesNiece: string;
  spousesGrandson(greats: number): string;
  spousesGranddaughter(greats: number): string;
  spousesDescendant(female: boolean): string;
  spousesCousin(female: boolean): string;
  spousesHalfRelative(female: boolean): string;
  granddaughterHusband: string;
  grandsonWife: string;
  descendantSpouse(female: boolean): string;
  nieceHusband: string;
  nephewWife: string;
  cousinHusband: string;
  cousinWife: string;
  siblingGrandchild(siblingFemale: boolean | null, female: boolean): string;
  siblingGrandchildSpouse(female: boolean): string;
  relative(female: boolean): string;
  inLaw(female: boolean): string;
}

const pl: KinshipLabels = {
  father: 'Ojciec',
  mother: 'Matka',
  son: 'Syn',
  daughter: 'Córka',
  husband: 'Mąż',
  wife: 'Żona',
  brother: 'Brat',
  sister: 'Siostra',
  ancestor: (g, f) =>
    g === 0
      ? f ? 'Babcia' : 'Dziadek'
      : f ? `${'Pra'.repeat(g)}babcia` : `${'Pra'.repeat(g)}dziadek`,
  descendant: (g, f) =>
    g === 0
      ? f ? 'Wnuczka' : 'Wnuk'
      : f ? `${'Pra'.repeat(g)}wnuczka` : `${'Pra'.repeat(g)}wnuk`,
  uncle: 'Wujek',
  aunt: 'Ciocia',
  nephew: (sc) => (sc === true ? 'Siostrzeniec' : 'Bratanek'),
  niece: (sc) => (sc === true ? 'Siostrzenica' : 'Bratanica'),
  cousin: (f) => (f ? 'Kuzynka' : 'Kuzyn'),
  cousinNumbered: (n, f) => (f ? `${n}. Kuzynka` : `${n}. Kuzyn`),
  fatherInLaw: 'Teść',
  motherInLaw: 'Teściowa',
  sonInLaw: 'Zięć',
  daughterInLaw: 'Synowa',
  brotherInLaw: 'Szwagier',
  sisterInLaw: 'Szwagierka',
  stepfather: 'Ojczym',
  stepmother: 'Macocha',
  stepson: 'Pasierb',
  stepdaughter: 'Pasierbica',
  halfBrother: 'Brat przyrodni',
  halfSister: 'Siostra przyrodnia',
  spousesGrandfather: (g) => (g === 0 ? 'Dziadek małżonka' : `${'Pra'.repeat(g)}dziadek małżonka`),
  spousesGrandmother: (g) => (g === 0 ? 'Babcia małżonka' : `${'Pra'.repeat(g)}babcia małżonka`),
  spousesUncle: 'Wuj małżonka',
  spousesAunt: 'Ciotka małżonka',
  spousesNephew: 'Bratanek małżonka',
  spousesNiece: 'Bratanica małżonka',
  spousesGrandson: (g) => (g === 0 ? 'Wnuk małżonka' : `${'Pra'.repeat(g)}wnuk małżonka`),
  spousesGranddaughter: (g) => (g === 0 ? 'Wnuczka małżonka' : `${'Pra'.repeat(g)}wnuczka małżonka`),
  spousesDescendant: () => 'Potomek małżonka',
  spousesCousin: (f) => (f ? 'Kuzynka małżonka' : 'Kuzyn małżonka'),
  spousesHalfRelative: (f) => (f ? 'Krewna przyrodnia' : 'Krewny przyrodni'),
  granddaughterHusband: 'Mąż wnuczki',
  grandsonWife: 'Żona wnuka',
  descendantSpouse: (f) => (f ? 'Małżonka potomka' : 'Małżonek potomka'),
  nieceHusband: 'Mąż bratanicy',
  nephewWife: 'Żona bratanka',
  cousinHusband: 'Mąż kuzynki',
  cousinWife: 'Żona kuzyna',
  siblingGrandchild: (sf, f) => {
    const sib = sf === true ? 'siostry' : sf === false ? 'brata' : 'brata/siostry';
    return f ? `Wnuczka ${sib}` : `Wnuk ${sib}`;
  },
  siblingGrandchildSpouse: (f) => (f ? 'Małżonka wnuka rodzeństwa' : 'Małżonek wnuka rodzeństwa'),
  relative: (f) => (f ? 'Krewna' : 'Krewny'),
  inLaw: (f) => (f ? 'Powinowata' : 'Powinowaty'),
};

const en: KinshipLabels = {
  father: 'Father', mother: 'Mother', son: 'Son', daughter: 'Daughter',
  husband: 'Husband', wife: 'Wife', brother: 'Brother', sister: 'Sister',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Grandmother' : 'Grandfather';
    if (g === 1) return f ? 'Great-grandmother' : 'Great-grandfather';
    const base = f ? 'grandmother' : 'grandfather';
    return `${'Great-'.repeat(g)}${base}`.replace(/^./, (c) => c.toUpperCase());
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Granddaughter' : 'Grandson';
    if (g === 1) return f ? 'Great-granddaughter' : 'Great-grandson';
    const base = f ? 'granddaughter' : 'grandson';
    return `${'Great-'.repeat(g)}${base}`.replace(/^./, (c) => c.toUpperCase());
  },
  uncle: 'Uncle', aunt: 'Aunt',
  nephew: () => 'Nephew', niece: () => 'Niece',
  cousin: () => 'Cousin',
  cousinNumbered: (n) => {
    const m10 = n % 10, m100 = n % 100;
    const s = m10 === 1 && m100 !== 11 ? 'st' : m10 === 2 && m100 !== 12 ? 'nd' : m10 === 3 && m100 !== 13 ? 'rd' : 'th';
    return `${n}${s} cousin`;
  },
  fatherInLaw: 'Father-in-law', motherInLaw: 'Mother-in-law',
  sonInLaw: 'Son-in-law', daughterInLaw: 'Daughter-in-law',
  brotherInLaw: 'Brother-in-law', sisterInLaw: 'Sister-in-law',
  stepfather: 'Stepfather', stepmother: 'Stepmother',
  stepson: 'Stepson', stepdaughter: 'Stepdaughter',
  halfBrother: 'Half-brother', halfSister: 'Half-sister',
  spousesGrandfather: (g) => (g === 0 ? "Spouse's grandfather" : "Spouse's great-grandfather"),
  spousesGrandmother: (g) => (g === 0 ? "Spouse's grandmother" : "Spouse's great-grandmother"),
  spousesUncle: "Spouse's uncle", spousesAunt: "Spouse's aunt",
  spousesNephew: "Spouse's nephew", spousesNiece: "Spouse's niece",
  spousesGrandson: () => "Spouse's grandson",
  spousesGranddaughter: () => "Spouse's granddaughter",
  spousesDescendant: () => "Spouse's descendant",
  spousesCousin: () => "Spouse's cousin",
  spousesHalfRelative: () => 'Half-relative',
  granddaughterHusband: "Granddaughter's husband",
  grandsonWife: "Grandson's wife",
  descendantSpouse: () => "Descendant's spouse",
  nieceHusband: "Niece's husband", nephewWife: "Nephew's wife",
  cousinHusband: "Cousin's husband", cousinWife: "Cousin's wife",
  siblingGrandchild: (_, f) => (f ? "Sibling's granddaughter" : "Sibling's grandson"),
  siblingGrandchildSpouse: () => "Sibling's grandchild's spouse",
  relative: () => 'Relative', inLaw: () => 'In-law',
};

const de: KinshipLabels = {
  father: 'Vater', mother: 'Mutter', son: 'Sohn', daughter: 'Tochter',
  husband: 'Ehemann', wife: 'Ehefrau', brother: 'Bruder', sister: 'Schwester',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Großmutter' : 'Großvater';
    if (g === 1) return f ? 'Urgroßmutter' : 'Urgroßvater';
    return f ? `${'Ur'.repeat(g)}großmutter` : `${'Ur'.repeat(g)}großvater`;
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Enkelin' : 'Enkel';
    if (g === 1) return f ? 'Urenkelin' : 'Urenkel';
    return f ? `${'Ur'.repeat(g)}enkelin` : `${'Ur'.repeat(g)}enkel`;
  },
  uncle: 'Onkel', aunt: 'Tante',
  nephew: () => 'Neffe', niece: () => 'Nichte',
  cousin: (f) => (f ? 'Cousine' : 'Cousin'),
  cousinNumbered: (n, f) => (f ? `Cousine ${n}. Grades` : `Cousin ${n}. Grades`),
  fatherInLaw: 'Schwiegervater', motherInLaw: 'Schwiegermutter',
  sonInLaw: 'Schwiegersohn', daughterInLaw: 'Schwiegertochter',
  brotherInLaw: 'Schwager', sisterInLaw: 'Schwägerin',
  stepfather: 'Stiefvater', stepmother: 'Stiefmutter',
  stepson: 'Stiefsohn', stepdaughter: 'Stieftochter',
  halfBrother: 'Halbbruder', halfSister: 'Halbschwester',
  spousesGrandfather: (g) => (g === 0 ? 'Großvater des Partners' : 'Urgroßvater des Partners'),
  spousesGrandmother: (g) => (g === 0 ? 'Großmutter des Partners' : 'Urgroßmutter des Partners'),
  spousesUncle: 'Onkel des Partners', spousesAunt: 'Tante des Partners',
  spousesNephew: 'Neffe des Partners', spousesNiece: 'Nichte des Partners',
  spousesGrandson: () => 'Enkel des Partners',
  spousesGranddaughter: () => 'Enkelin des Partners',
  spousesDescendant: () => 'Nachkomme des Partners',
  spousesCousin: (f) => (f ? 'Cousine des Partners' : 'Cousin des Partners'),
  spousesHalfRelative: () => 'Halbverwandter',
  granddaughterHusband: 'Mann der Enkelin',
  grandsonWife: 'Frau des Enkels',
  descendantSpouse: () => 'Partner des Nachkommen',
  nieceHusband: 'Mann der Nichte', nephewWife: 'Frau des Neffen',
  cousinHusband: 'Mann der Cousine', cousinWife: 'Frau des Cousins',
  siblingGrandchild: (_, f) => (f ? 'Enkelin des Geschwisters' : 'Enkel des Geschwisters'),
  siblingGrandchildSpouse: () => 'Partner des Geschwisterenkels',
  relative: () => 'Verwandter', inLaw: () => 'Angeheiratet',
};

const nl: KinshipLabels = {
  father: 'Vader', mother: 'Moeder', son: 'Zoon', daughter: 'Dochter',
  husband: 'Echtgenoot', wife: 'Echtgenote', brother: 'Broer', sister: 'Zus',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Grootmoeder' : 'Grootvader';
    if (g === 1) return f ? 'Overgrootmoeder' : 'Overgrootvader';
    return f ? `${'Over'.repeat(g)}grootmoeder` : `${'Over'.repeat(g)}grootvader`;
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Kleindochter' : 'Kleinzoon';
    if (g === 1) return f ? 'Achterkleindochter' : 'Achterkleinzoon';
    return f ? `${'Achter'.repeat(g)}kleindochter` : `${'Achter'.repeat(g)}kleinzoon`;
  },
  uncle: 'Oom', aunt: 'Tante',
  nephew: () => 'Neef', niece: () => 'Nicht',
  cousin: (f) => (f ? 'Nicht' : 'Neef'),
  cousinNumbered: (n, f) => (f ? `Achternicht (${n}e graad)` : `Achterneef (${n}e graad)`),
  fatherInLaw: 'Schoonvader', motherInLaw: 'Schoonmoeder',
  sonInLaw: 'Schoonzoon', daughterInLaw: 'Schoondochter',
  brotherInLaw: 'Zwager', sisterInLaw: 'Schoonzus',
  stepfather: 'Stiefvader', stepmother: 'Stiefmoeder',
  stepson: 'Stiefzoon', stepdaughter: 'Stiefdochter',
  halfBrother: 'Halfbroer', halfSister: 'Halfzus',
  spousesGrandfather: (g) => (g === 0 ? 'Grootvader van partner' : 'Overgrootvader van partner'),
  spousesGrandmother: (g) => (g === 0 ? 'Grootmoeder van partner' : 'Overgrootmoeder van partner'),
  spousesUncle: 'Oom van partner', spousesAunt: 'Tante van partner',
  spousesNephew: 'Neef van partner', spousesNiece: 'Nicht van partner',
  spousesGrandson: () => 'Kleinzoon van partner',
  spousesGranddaughter: () => 'Kleindochter van partner',
  spousesDescendant: () => 'Nakomeling van partner',
  spousesCousin: (f) => (f ? 'Nicht van partner' : 'Neef van partner'),
  spousesHalfRelative: () => 'Halffamilielid',
  granddaughterHusband: 'Man van kleindochter',
  grandsonWife: 'Vrouw van kleinzoon',
  descendantSpouse: () => 'Partner van nakomeling',
  nieceHusband: 'Man van nicht', nephewWife: 'Vrouw van neef',
  cousinHusband: 'Man van nicht', cousinWife: 'Vrouw van neef',
  siblingGrandchild: (_, f) => (f ? 'Kleindochter van broer/zus' : 'Kleinzoon van broer/zus'),
  siblingGrandchildSpouse: () => 'Partner van kleinkind van broer/zus',
  relative: () => 'Familielid', inLaw: () => 'Aangetrouwd',
};

const no: KinshipLabels = {
  father: 'Far', mother: 'Mor', son: 'Sønn', daughter: 'Datter',
  husband: 'Ektemann', wife: 'Kone', brother: 'Bror', sister: 'Søster',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Bestemor' : 'Bestefar';
    if (g === 1) return f ? 'Oldemor' : 'Oldefar';
    if (g === 2) return f ? 'Tippoldemor' : 'Tippoldefar';
    return f ? `${'Tipp'.repeat(g - 1)}oldemor` : `${'Tipp'.repeat(g - 1)}oldefar`;
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Barnebarn (datter)' : 'Barnebarn (sønn)';
    if (g === 1) return f ? 'Oldebarn (jente)' : 'Oldebarn (gutt)';
    return f ? `${'Tipp'.repeat(g - 1)}oldebarn (jente)` : `${'Tipp'.repeat(g - 1)}oldebarn (gutt)`;
  },
  uncle: 'Onkel', aunt: 'Tante',
  nephew: () => 'Nevø', niece: () => 'Niese',
  cousin: (f) => (f ? 'Kusine' : 'Fetter'),
  cousinNumbered: (n) => `Tremenning (${n}. ledd)`,
  fatherInLaw: 'Svigerfar', motherInLaw: 'Svigermor',
  sonInLaw: 'Svigersønn', daughterInLaw: 'Svigerdatter',
  brotherInLaw: 'Svoger', sisterInLaw: 'Svigerinne',
  stepfather: 'Stefar', stepmother: 'Stemor',
  stepson: 'Stesønn', stepdaughter: 'Stedatter',
  halfBrother: 'Halvbror', halfSister: 'Halvsøster',
  spousesGrandfather: (g) => (g === 0 ? 'Ektefelles bestefar' : 'Ektefelles oldefar'),
  spousesGrandmother: (g) => (g === 0 ? 'Ektefelles bestemor' : 'Ektefelles oldemor'),
  spousesUncle: 'Ektefelles onkel', spousesAunt: 'Ektefelles tante',
  spousesNephew: 'Ektefelles nevø', spousesNiece: 'Ektefelles niese',
  spousesGrandson: () => 'Ektefelles barnebarn (gutt)',
  spousesGranddaughter: () => 'Ektefelles barnebarn (jente)',
  spousesDescendant: () => 'Ektefelles etterkommer',
  spousesCousin: (f) => (f ? 'Ektefelles kusine' : 'Ektefelles fetter'),
  spousesHalfRelative: () => 'Halvslektning',
  granddaughterHusband: 'Barnebarnets ektemann',
  grandsonWife: 'Barnebarnets kone',
  descendantSpouse: () => 'Etterkommerens ektefelle',
  nieceHusband: 'Niesens ektemann', nephewWife: 'Nevøens kone',
  cousinHusband: 'Kusinens ektemann', cousinWife: 'Fetterens kone',
  siblingGrandchild: (_, f) => (f ? 'Søskens barnebarn (jente)' : 'Søskens barnebarn (gutt)'),
  siblingGrandchildSpouse: () => 'Søskenbarnebarnets ektefelle',
  relative: () => 'Slektning', inLaw: () => 'Inngiftet',
};

const sv: KinshipLabels = {
  father: 'Far', mother: 'Mor', son: 'Son', daughter: 'Dotter',
  husband: 'Make', wife: 'Maka', brother: 'Bror', sister: 'Syster',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Mormor/Farmor' : 'Morfar/Farfar';
    if (g === 1) return f ? 'Gammelmormor' : 'Gammelmorfar';
    return f ? `${'Gammel'.repeat(g)}mormor` : `${'Gammel'.repeat(g)}morfar`;
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Barnbarn (flicka)' : 'Barnbarn (pojke)';
    if (g === 1) return f ? 'Barnbarnsbarn (flicka)' : 'Barnbarnsbarn (pojke)';
    return f ? `${'Barn'.repeat(g)}barnsbarn (flicka)` : `${'Barn'.repeat(g)}barnsbarn (pojke)`;
  },
  uncle: 'Morbror/Farbror', aunt: 'Moster/Faster',
  nephew: () => 'Brorson/Systerson', niece: () => 'Brorsdotter/Systerdotter',
  cousin: () => 'Kusin',
  cousinNumbered: (n) => `Syssling (${n}. ledet)`,
  fatherInLaw: 'Svärfar', motherInLaw: 'Svärmor',
  sonInLaw: 'Svärson', daughterInLaw: 'Svärdotter',
  brotherInLaw: 'Svåger', sisterInLaw: 'Svägerska',
  stepfather: 'Styvfar', stepmother: 'Styvmor',
  stepson: 'Styvson', stepdaughter: 'Styvdotter',
  halfBrother: 'Halvbror', halfSister: 'Halvsyster',
  spousesGrandfather: (g) => (g === 0 ? 'Makens farfar/morfar' : 'Makens gammelmorfar'),
  spousesGrandmother: (g) => (g === 0 ? 'Makens mormor/farmor' : 'Makens gammelmormor'),
  spousesUncle: 'Makens morbror/farbror', spousesAunt: 'Makens moster/faster',
  spousesNephew: 'Makens brorson/systerson', spousesNiece: 'Makens brorsdotter/systerdotter',
  spousesGrandson: () => 'Makens barnbarn (pojke)',
  spousesGranddaughter: () => 'Makens barnbarn (flicka)',
  spousesDescendant: () => 'Makens ättling',
  spousesCousin: () => 'Makens kusin',
  spousesHalfRelative: () => 'Halvsläkting',
  granddaughterHusband: 'Barnbarns make', grandsonWife: 'Barnbarns maka',
  descendantSpouse: () => 'Ättlings make/maka',
  nieceHusband: 'Brorsdotters/Systerdotters make',
  nephewWife: 'Brorsons/Systersons maka',
  cousinHusband: 'Kusins make', cousinWife: 'Kusins maka',
  siblingGrandchild: (_, f) => (f ? 'Syskons barnbarn (flicka)' : 'Syskons barnbarn (pojke)'),
  siblingGrandchildSpouse: () => 'Syskonbarnbarns make/maka',
  relative: () => 'Släkting', inLaw: () => 'Ingift',
};

const da: KinshipLabels = {
  father: 'Far', mother: 'Mor', son: 'Søn', daughter: 'Datter',
  husband: 'Ægtemand', wife: 'Hustru', brother: 'Bror', sister: 'Søster',
  ancestor: (g, f) => {
    if (g === 0) return f ? 'Bedstemor' : 'Bedstefar';
    if (g === 1) return f ? 'Oldemor' : 'Oldefar';
    if (g === 2) return f ? 'Tipoldemor' : 'Tipoldefar';
    return f ? `${'Tip'.repeat(g - 1)}oldemor` : `${'Tip'.repeat(g - 1)}oldefar`;
  },
  descendant: (g, f) => {
    if (g === 0) return f ? 'Barnebarn (pige)' : 'Barnebarn (dreng)';
    if (g === 1) return f ? 'Oldebarn (pige)' : 'Oldebarn (dreng)';
    return f ? `${'Tip'.repeat(g - 1)}oldebarn (pige)` : `${'Tip'.repeat(g - 1)}oldebarn (dreng)`;
  },
  uncle: 'Onkel', aunt: 'Tante',
  nephew: () => 'Nevø', niece: () => 'Niece',
  cousin: (f) => (f ? 'Kusine' : 'Fætter'),
  cousinNumbered: (n, f) => (f ? `Næstkusine (${n}. led)` : `Næstfætter (${n}. led)`),
  fatherInLaw: 'Svigerfar', motherInLaw: 'Svigermor',
  sonInLaw: 'Svigersøn', daughterInLaw: 'Svigerdatter',
  brotherInLaw: 'Svoger', sisterInLaw: 'Svigerinde',
  stepfather: 'Stedfar', stepmother: 'Stedmor',
  stepson: 'Stedsøn', stepdaughter: 'Steddatter',
  halfBrother: 'Halvbror', halfSister: 'Halvsøster',
  spousesGrandfather: (g) => (g === 0 ? 'Ægtefælles bedstefar' : 'Ægtefælles oldefar'),
  spousesGrandmother: (g) => (g === 0 ? 'Ægtefælles bedstemor' : 'Ægtefælles oldemor'),
  spousesUncle: 'Ægtefælles onkel', spousesAunt: 'Ægtefælles tante',
  spousesNephew: 'Ægtefælles nevø', spousesNiece: 'Ægtefælles niece',
  spousesGrandson: () => 'Ægtefælles barnebarn (dreng)',
  spousesGranddaughter: () => 'Ægtefælles barnebarn (pige)',
  spousesDescendant: () => 'Ægtefælles efterkommer',
  spousesCousin: (f) => (f ? 'Ægtefælles kusine' : 'Ægtefælles fætter'),
  spousesHalfRelative: () => 'Halvslægtning',
  granddaughterHusband: 'Barnebarnets ægtemand',
  grandsonWife: 'Barnebarnets hustru',
  descendantSpouse: () => 'Efterkommerens ægtefælle',
  nieceHusband: 'Niecens ægtemand', nephewWife: 'Nevøens hustru',
  cousinHusband: 'Kusinens ægtemand', cousinWife: 'Fætterens hustru',
  siblingGrandchild: (_, f) => (f ? 'Søskendes barnebarn (pige)' : 'Søskendes barnebarn (dreng)'),
  siblingGrandchildSpouse: () => 'Søskendebarnebarnets ægtefælle',
  relative: () => 'Slægtning', inLaw: () => 'Indgift',
};

const dictionaries: Record<Locale, KinshipLabels> = { pl, en, de, nl, no, sv, da };

export function getKinshipLabels(): KinshipLabels {
  return dictionaries[(i18n.language as Locale) ?? 'pl'] ?? pl;
}
