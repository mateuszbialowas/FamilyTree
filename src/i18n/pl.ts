/**
 * Polskie tłumaczenia — źródło prawdy dla kształtu obiektu tłumaczeń.
 * Każdy inny język musi zaimplementować ten sam kształt (zob. `Translations` w `index.ts`).
 *
 * Konwencja: namespace per ekran lub obszar funkcjonalny. Template-stringi
 * wyrażone jako funkcje, żeby parametry nie rozjeżdżały się w tłumaczeniach
 * (każdy język ma dowolną kolejność / fleksję).
 *
 * Nieobjęte tym słownikiem:
 * - `src/utils/relationshipLabels.ts` — dynamiczny generator ~100 kombinacji
 *   (ścieżka + płeć + tryb). Osobny problem do lokalizacji.
 */
export const pl = {
  app: {
    // Nazwa aplikacji. Nazwa widoczna na pulpicie (home screen) siedzi dodatkowo
    // w `app.json` → `expo.name` (trzeba zmieniać tam osobno).
    name: 'Drzewo genealogiczne',
  },

  common: {
    cancel: 'Anuluj',
    save: 'Zapisz',
    delete: 'Usuń',
    clear: 'Wyczyść',
    done: 'Gotowe',
    search: 'Szukaj',
    error: 'Błąd',
    back: 'Wróć',
    unknown: 'Nieznana',
    alive: 'Żyje',
    selectDate: 'Wybierz datę',
  },

  splash: {
    title: 'Drzewo genealogiczne',
  },

  nav: {
    tabTree: 'Drzewo',
    tabList: 'Lista',
    tabSettings: 'Ustawienia',
    homeTree: 'Drzewo',
    homeList: 'Lista osób',
    homeSettings: 'Ustawienia',
    titlePersonDetail: 'Szczegóły',
    titleAddPerson: 'Nowa osoba',
    titleEditPerson: 'Edycja',
    titleAddRelationship: 'Nowa relacja',
  },

  tree: {
    rootLabel: 'Korzeń drzewa:',
    rootPickerTitle: 'Wybierz korzeń drzewa',
    emptyTitle: 'Brak osób w drzewie',
    emptySubtitle: 'Dodaj pierwszą osobę używając przycisku +',
    longPressTitle: 'Dodaj powiązaną osobę',
    longPressAddParent: 'Dodaj rodzica',
    longPressAddChild: 'Dodaj dziecko',
    longPressAddSpouse: 'Dodaj małżonka',
    longPressAddSibling: 'Dodaj rodzeństwo',
    bornPrefix: 'ur.',
  },

  peopleList: {
    searchPlaceholder: 'Szukaj po imieniu lub nazwisku...',
    emptyTitle: 'Twoja kronika jest pusta',
    emptySubtitle: 'Dodaj pierwszą osobę, naciskając przycisk +',
  },

  personForm: {
    firstNameLabel: 'Imię *',
    firstNamePlaceholder: 'Wprowadź imię',
    lastNameLabel: 'Nazwisko *',
    lastNamePlaceholder: 'Wprowadź nazwisko',
    genderLabel: 'Płeć',
    genderMale: 'Mężczyzna',
    genderFemale: 'Kobieta',
    birthDateLabel: 'Data urodzenia',
    deathDateLabel: 'Data śmierci (opcjonalne)',
    clearBirthDate: 'Wyczyść datę urodzenia',
    clearDeathDate: 'Wyczyść datę śmierci',
    notesLabel: 'Notatki',
    notesPlaceholder: 'Dodatkowe informacje...',
    requiredError: 'Imię i nazwisko są wymagane.',
  },

  personDetail: {
    notFound: 'Nie znaleziono osoby',
    birthDateLabel: 'Data urodzenia',
    deathDateLabel: 'Data śmierci',
    notesLabel: 'Notatki',
    sectionParents: 'Rodzice',
    sectionSpouses: 'Małżonkowie',
    sectionChildren: 'Dzieci',
    sectionSiblings: 'Rodzeństwo',
    relParent: 'Rodzic',
    relSpouse: 'Małżonek',
    relChild: 'Dziecko',
    relSibling: 'Rodzeństwo',
    marriageLabel: 'Ślub',
    divorceLabel: 'Rozwód',
    btnEdit: 'Edytuj',
    btnAddRelationship: 'Dodaj relację',
    btnDelete: 'Usuń osobę',
    deleteTitle: 'Usuń osobę',
    deleteBody: (firstName: string, lastName: string) =>
      `Czy na pewno chcesz usunąć ${firstName} ${lastName}? Usunięte zostaną również wszystkie powiązane relacje.`,
    removeRelationshipTitle: 'Usuń relację',
    removeRelationshipBody: 'Czy na pewno chcesz usunąć tę relację?',
  },

  addPerson: {
    title: 'Dodaj osobę',
    saveLabel: 'Zapisz',
    relationLabelFor: (firstName: string, lastName: string) => `dla ${firstName} ${lastName}`,
    relationParent: 'Rodzic dla',
    relationChild: 'Dziecko dla',
    relationSpouse: 'Małżonek dla',
    relationSibling: 'Rodzeństwo dla',
    siblingPreviewTitle: 'Automatyczne powiązania',
    siblingPreviewBody: (firstName: string) =>
      `Nowa osoba zostanie przypisana jako dziecko tych samych rodziców co ${firstName}:`,
    siblingPreviewEmpty: (firstName: string) =>
      `${firstName} nie ma jeszcze przypisanych rodziców, więc żadne relacje nie zostaną dodane automatycznie.`,
  },

  editPerson: {
    title: 'Edytuj osobę',
    saveLabel: 'Zapisz zmiany',
  },

  addRelationship: {
    title: 'Dodaj relację',
    forSubtitle: (firstName: string, lastName: string) => `dla ${firstName} ${lastName}`,
    typeLabel: 'Typ relacji',
    typeParentChild: (firstName: string) => `${firstName} jest rodzicem`,
    typeChildParent: (firstName: string) => `${firstName} jest dzieckiem`,
    typeMarriage: 'Małżeństwo',
    marriageDateLabel: 'Data ślubu (opcjonalne)',
    selectPersonLabel: 'Wybierz osobę',
    searchPlaceholder: 'Szukaj...',
    save: 'Zapisz relację',
    errorSelectPerson: 'Wybierz osobę.',
    errorParentChildExists: 'Ta relacja rodzic-dziecko już istnieje.',
    errorMarriageExists: 'To małżeństwo już istnieje.',
  },

  settings: {
    title: 'Ustawienia',
    history: (count: number) => `Historia zmian (${count})`,
    importJson: 'Importuj dane (JSON)',
    exportJson: 'Eksportuj dane (JSON)',
    clearAll: 'Wyczyść wszystkie dane',
    exportDialogTitle: 'Eksportuj drzewo genealogiczne',
    exportFail: 'Nie udało się wyeksportować danych.',
    importInvalidJson: 'Plik nie jest prawidłowym JSON-em.',
    importInvalidTitle: 'Nieprawidłowy plik',
    importFail: 'Nie udało się zaimportować danych.',
    importConfirmTitle: 'Import danych',
    importConfirmBody: (people: number, relations: number, marriages: number) =>
      `Znaleziono ${people} osób, ${relations} relacji, ${marriages} małżeństw. Zastąpić obecne dane?`,
    importConfirmCta: 'Importuj',
    clearTitle: 'Wyczyść dane',
    clearBody: 'Czy na pewno chcesz usunąć wszystkie dane? Tej operacji nie można cofnąć.',
  },

  history: {
    title: 'Historia zmian',
    emptyTitle: 'Brak historii',
    emptySubtitle: 'Zacznij dodawać lub edytować osoby, żeby zobaczyć listę zmian.',
    currentChip: 'Bieżący',
    initialLabel: 'Stan początkowy',
    loadedLabel: 'Wczytano zapisane dane',
    // Etykiety dla describeAction
    actions: {
      addedPerson: (name: string) => `Dodano osobę: ${name}`,
      updatedPerson: (name: string) => `Zaktualizowano: ${name}`,
      deletedPerson: (name: string) => `Usunięto osobę: ${name}`,
      addedParentChild: (parent: string, child: string) =>
        `Powiązano rodzica i dziecko: ${parent} → ${child}`,
      addedMarriage: (s1: string, s2: string) => `Dodano małżeństwo: ${s1} ⚭ ${s2}`,
      removedParentChild: (parent: string, child: string) =>
        `Usunięto relację: ${parent} → ${child}`,
      removedParentChildGeneric: 'Usunięto relację rodzic-dziecko',
      removedMarriage: (s1: string, s2: string) => `Usunięto małżeństwo: ${s1} ⚭ ${s2}`,
      removedMarriageGeneric: 'Usunięto małżeństwo',
      importedData: (count: number) => `Zaimportowano dane (${count} osób)`,
      clearedAll: 'Wyczyszczono wszystkie dane',
      unknownPerson: 'nieznana osoba',
    },
  },

  // Komunikaty błędów walidacji pliku importu. Każda funkcja przyjmuje indeks
  // pozycji (liczony od 0) zgodnie z kolejnością w pliku JSON.
  validateImport: {
    rootNotObject: 'Plik nie zawiera obiektu JSON.',
    missingPeople: 'Brak listy osób (people).',
    missingParentChild: 'Brak listy relacji rodzic-dziecko.',
    missingMarriages: 'Brak listy małżeństw.',
    personNotObject: (i: number) => `osoba #${i}: nie jest obiektem`,
    personMissingId: (i: number) => `osoba #${i}: brak id`,
    personMissingFirstName: (i: number) => `osoba #${i}: brak imienia`,
    personMissingLastName: (i: number) => `osoba #${i}: brak nazwiska`,
    personInvalidGender: (i: number) => `osoba #${i}: nieprawidłowa płeć`,
    personInvalidBirth: (i: number) => `osoba #${i}: nieprawidłowa data urodzenia`,
    personInvalidDeath: (i: number) => `osoba #${i}: nieprawidłowa data śmierci`,
    personMissingNotes: (i: number) => `osoba #${i}: brak notatek`,
    personDuplicateId: (i: number, id: string) => `osoba #${i}: zduplikowane id ${id}`,
    pcNotObject: (i: number) => `relacja rodzic-dziecko #${i}: nie jest obiektem`,
    pcMissingId: (i: number) => `relacja rodzic-dziecko #${i}: brak id`,
    pcMissingParentId: (i: number) => `relacja rodzic-dziecko #${i}: brak parentId`,
    pcMissingChildId: (i: number) => `relacja rodzic-dziecko #${i}: brak childId`,
    pcUnknownParent: (i: number) => `relacja rodzic-dziecko #${i}: parentId wskazuje nieistniejącą osobę`,
    pcUnknownChild: (i: number) => `relacja rodzic-dziecko #${i}: childId wskazuje nieistniejącą osobę`,
    pcSelfReference: (i: number) => `relacja rodzic-dziecko #${i}: parent i child to ta sama osoba`,
    marNotObject: (i: number) => `małżeństwo #${i}: nie jest obiektem`,
    marMissingId: (i: number) => `małżeństwo #${i}: brak id`,
    marMissingSpouse1: (i: number) => `małżeństwo #${i}: brak spouse1Id`,
    marMissingSpouse2: (i: number) => `małżeństwo #${i}: brak spouse2Id`,
    marUnknownSpouse1: (i: number) => `małżeństwo #${i}: spouse1Id wskazuje nieistniejącą osobę`,
    marUnknownSpouse2: (i: number) => `małżeństwo #${i}: spouse2Id wskazuje nieistniejącą osobę`,
    marSelfReference: (i: number) => `małżeństwo #${i}: małżonkowie to ta sama osoba`,
    marInvalidMarriageDate: (i: number) => `małżeństwo #${i}: nieprawidłowa data ślubu`,
    marInvalidDivorceDate: (i: number) => `małżeństwo #${i}: nieprawidłowa data rozwodu`,
  },
};
