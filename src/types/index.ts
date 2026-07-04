export type Person = {
  id: string;
  firstName: string;
  lastName: string;
  /** Birth surname (Polish "nazwisko rodowe" / née). Optional. */
  birthSurname?: string | null;
  gender: 'male' | 'female';
  birthDate: string | null;
  deathDate: string | null;
  /**
   * Whether the person is deceased. Lets the user record a death with an
   * unknown date. Backward-compat: an absent flag combined with a non-null
   * `deathDate` is treated as deceased.
   */
  deceased?: boolean;
  notes: string;
  /**
   * Manual left→right position among full siblings. When unset, siblings are
   * ordered by birthDate. Set for an entire sibling group the moment the user
   * reorders any of them (see REORDER_SIBLING).
   */
  manualOrder?: number | null;
};

/** A relationship the user can add relative to an existing person. */
export type RelationType = 'parent' | 'child' | 'spouse' | 'sibling';

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
  | { type: 'UPDATE_MARRIAGE'; payload: Marriage }
  | { type: 'REMOVE_RELATIONSHIP'; payload: { id: string; kind: 'parentChild' | 'marriage' } }
  | { type: 'REORDER_SIBLING'; payload: { personId: string; direction: 'left' | 'right' } }
  | { type: 'PLACE_NEW_SIBLING'; payload: { personId: string } }
  | { type: 'IMPORT_DATA'; payload: FamilyState }
  | { type: 'CLEAR_DATA' };
