export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  birthDate: string | null;
  deathDate: string | null;
  notes: string;
  photoUri?: string | null;
};

export type ParentChildRelationship = {
  id: string;
  parentId: string;
  childId: string;
};

export type Marriage = {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageDate: string | null;
  divorceDate: string | null;
};

export type FamilyState = {
  people: Person[];
  parentChildRelationships: ParentChildRelationship[];
  marriages: Marriage[];
};

export type FamilyAction =
  | { type: 'ADD_PERSON'; payload: Person }
  | { type: 'UPDATE_PERSON'; payload: Person }
  | { type: 'DELETE_PERSON'; payload: string }
  | { type: 'ADD_PARENT_CHILD'; payload: ParentChildRelationship }
  | { type: 'ADD_MARRIAGE'; payload: Marriage }
  | { type: 'REMOVE_RELATIONSHIP'; payload: { id: string; kind: 'parentChild' | 'marriage' } }
  | { type: 'CLEAR_PHOTO'; payload: string }
  | { type: 'IMPORT_DATA'; payload: FamilyState }
  | { type: 'CLEAR_DATA' };
