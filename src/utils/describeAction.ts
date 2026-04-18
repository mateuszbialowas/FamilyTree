import type { FamilyAction, FamilyState } from '../types';

function nameOf(id: string | undefined, state: FamilyState): string {
  if (!id) return 'nieznana osoba';
  const p = state.people.find(x => x.id === id);
  return p ? `${p.firstName} ${p.lastName}` : 'nieznana osoba';
}

export function describeAction(action: FamilyAction, stateBefore: FamilyState): string {
  switch (action.type) {
    case 'ADD_PERSON':
      return `Dodano osobę: ${action.payload.firstName} ${action.payload.lastName}`;

    case 'UPDATE_PERSON':
      return `Zaktualizowano: ${action.payload.firstName} ${action.payload.lastName}`;

    case 'DELETE_PERSON':
      return `Usunięto osobę: ${nameOf(action.payload, stateBefore)}`;

    case 'ADD_PARENT_CHILD':
      return `Powiązano rodzica i dziecko: ${nameOf(action.payload.parentId, stateBefore)} → ${nameOf(action.payload.childId, stateBefore)}`;

    case 'ADD_MARRIAGE':
      return `Dodano małżeństwo: ${nameOf(action.payload.spouse1Id, stateBefore)} ⚭ ${nameOf(action.payload.spouse2Id, stateBefore)}`;

    case 'REMOVE_RELATIONSHIP': {
      if (action.payload.kind === 'parentChild') {
        const r = stateBefore.parentChildRelationships.find(x => x.id === action.payload.id);
        if (r) return `Usunięto relację: ${nameOf(r.parentId, stateBefore)} → ${nameOf(r.childId, stateBefore)}`;
        return 'Usunięto relację rodzic-dziecko';
      }
      const m = stateBefore.marriages.find(x => x.id === action.payload.id);
      if (m) return `Usunięto małżeństwo: ${nameOf(m.spouse1Id, stateBefore)} ⚭ ${nameOf(m.spouse2Id, stateBefore)}`;
      return 'Usunięto małżeństwo';
    }

    case 'IMPORT_DATA':
      return `Zaimportowano dane (${action.payload.people.length} osób)`;

    case 'CLEAR_DATA':
      return 'Wyczyszczono wszystkie dane';
  }
}
