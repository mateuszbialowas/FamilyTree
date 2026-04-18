import type { FamilyAction, FamilyState } from '../types';
import { t } from '../i18n';

function nameOf(id: string | undefined, state: FamilyState): string {
  if (!id) return t.history.actions.unknownPerson;
  const p = state.people.find(x => x.id === id);
  return p ? `${p.firstName} ${p.lastName}` : t.history.actions.unknownPerson;
}

export function describeAction(action: FamilyAction, stateBefore: FamilyState): string {
  const a = t.history.actions;
  switch (action.type) {
    case 'ADD_PERSON':
      return a.addedPerson(`${action.payload.firstName} ${action.payload.lastName}`);

    case 'UPDATE_PERSON':
      return a.updatedPerson(`${action.payload.firstName} ${action.payload.lastName}`);

    case 'DELETE_PERSON':
      return a.deletedPerson(nameOf(action.payload, stateBefore));

    case 'ADD_PARENT_CHILD':
      return a.addedParentChild(
        nameOf(action.payload.parentId, stateBefore),
        nameOf(action.payload.childId, stateBefore),
      );

    case 'ADD_MARRIAGE':
      return a.addedMarriage(
        nameOf(action.payload.spouse1Id, stateBefore),
        nameOf(action.payload.spouse2Id, stateBefore),
      );

    case 'REMOVE_RELATIONSHIP': {
      if (action.payload.kind === 'parentChild') {
        const r = stateBefore.parentChildRelationships.find(x => x.id === action.payload.id);
        if (r) return a.removedParentChild(nameOf(r.parentId, stateBefore), nameOf(r.childId, stateBefore));
        return a.removedParentChildGeneric;
      }
      const m = stateBefore.marriages.find(x => x.id === action.payload.id);
      if (m) return a.removedMarriage(nameOf(m.spouse1Id, stateBefore), nameOf(m.spouse2Id, stateBefore));
      return a.removedMarriageGeneric;
    }

    case 'IMPORT_DATA':
      return a.importedData(action.payload.people.length);

    case 'CLEAR_DATA':
      return a.clearedAll;
  }
}
