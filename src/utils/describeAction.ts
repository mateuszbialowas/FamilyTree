import type { FamilyAction, FamilyState } from '../types';
import i18n from 'i18next';

function nameOf(id: string | undefined, state: FamilyState): string {
  if (!id) return i18n.t('history.actions.unknownPerson');
  const p = state.people.find(x => x.id === id);
  return p ? `${p.firstName} ${p.lastName}` : i18n.t('history.actions.unknownPerson');
}

export function describeAction(action: FamilyAction, stateBefore: FamilyState): string {
  switch (action.type) {
    case 'ADD_PERSON':
      return i18n.t('history.actions.addedPerson', { name: `${action.payload.firstName} ${action.payload.lastName}` });

    case 'UPDATE_PERSON':
      return i18n.t('history.actions.updatedPerson', { name: `${action.payload.firstName} ${action.payload.lastName}` });

    case 'DELETE_PERSON':
      return i18n.t('history.actions.deletedPerson', { name: nameOf(action.payload, stateBefore) });

    case 'ADD_PARENT_CHILD':
      return i18n.t('history.actions.addedParentChild', {
        parent: nameOf(action.payload.parentId, stateBefore),
        child: nameOf(action.payload.childId, stateBefore),
      });

    case 'ADD_MARRIAGE':
      return i18n.t('history.actions.addedMarriage', {
        s1: nameOf(action.payload.spouse1Id, stateBefore),
        s2: nameOf(action.payload.spouse2Id, stateBefore),
      });

    case 'REMOVE_RELATIONSHIP': {
      if (action.payload.kind === 'parentChild') {
        const r = stateBefore.parentChildRelationships.find(x => x.id === action.payload.id);
        if (r) return i18n.t('history.actions.removedParentChild', {
          parent: nameOf(r.parentId, stateBefore),
          child: nameOf(r.childId, stateBefore),
        });
        return i18n.t('history.actions.removedParentChildGeneric');
      }
      const m = stateBefore.marriages.find(x => x.id === action.payload.id);
      if (m) return i18n.t('history.actions.removedMarriage', {
        s1: nameOf(m.spouse1Id, stateBefore),
        s2: nameOf(m.spouse2Id, stateBefore),
      });
      return i18n.t('history.actions.removedMarriageGeneric');
    }

    case 'IMPORT_DATA':
      return i18n.t('history.actions.importedData', { count: action.payload.people.length });

    case 'CLEAR_DATA':
      return i18n.t('history.actions.clearedAll');
  }
}
