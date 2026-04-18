import { describe, it, expect } from 'vitest';
import { describeAction } from '../describeAction';
import type { FamilyState, Person } from '../../types';

function person(id: string, firstName: string, lastName: string): Person {
  return { id, firstName, lastName, gender: 'male', birthDate: null, deathDate: null, notes: '' };
}

const emptyState: FamilyState = { people: [], parentChildRelationships: [], marriages: [] };

describe('describeAction', () => {
  it('ADD_PERSON — imię z payloadu', () => {
    const label = describeAction(
      { type: 'ADD_PERSON', payload: person('p1', 'Jan', 'Kowalski') },
      emptyState,
    );
    expect(label).toBe('Dodano osobę: Jan Kowalski');
  });

  it('UPDATE_PERSON — imię z payloadu (aktualnej wersji)', () => {
    const label = describeAction(
      { type: 'UPDATE_PERSON', payload: person('p1', 'Jan', 'Nowak') },
      { ...emptyState, people: [person('p1', 'Jan', 'Kowalski')] },
    );
    expect(label).toBe('Zaktualizowano: Jan Nowak');
  });

  it('DELETE_PERSON — imię rozwiązywane ze stanu PRZED akcją', () => {
    const stateBefore = { ...emptyState, people: [person('p1', 'Jan', 'Kowalski')] };
    const label = describeAction({ type: 'DELETE_PERSON', payload: 'p1' }, stateBefore);
    expect(label).toBe('Usunięto osobę: Jan Kowalski');
  });

  it('DELETE_PERSON — fallback gdy ID nieznane', () => {
    const label = describeAction({ type: 'DELETE_PERSON', payload: 'unknown' }, emptyState);
    expect(label).toBe('Usunięto osobę: nieznana osoba');
  });

  it('ADD_PARENT_CHILD — rozwiązuje oba imiona', () => {
    const state = { ...emptyState, people: [person('p1', 'Anna', 'X'), person('p2', 'Jan', 'X')] };
    const label = describeAction(
      { type: 'ADD_PARENT_CHILD', payload: { id: 'r1', parentId: 'p1', childId: 'p2' } },
      state,
    );
    expect(label).toBe('Powiązano rodzica i dziecko: Anna X → Jan X');
  });

  it('ADD_MARRIAGE — oboje małżonkowie', () => {
    const state = { ...emptyState, people: [person('p1', 'Anna', 'X'), person('p2', 'Jan', 'X')] };
    const label = describeAction(
      {
        type: 'ADD_MARRIAGE',
        payload: { id: 'm1', spouse1Id: 'p1', spouse2Id: 'p2', marriageDate: null, divorceDate: null },
      },
      state,
    );
    expect(label).toBe('Dodano małżeństwo: Anna X ⚭ Jan X');
  });

  it('REMOVE_RELATIONSHIP (parentChild) — rozwiązuje imiona z relacji w stateBefore', () => {
    const stateBefore: FamilyState = {
      people: [person('p1', 'Anna', 'X'), person('p2', 'Jan', 'X')],
      parentChildRelationships: [{ id: 'r1', parentId: 'p1', childId: 'p2' }],
      marriages: [],
    };
    const label = describeAction(
      { type: 'REMOVE_RELATIONSHIP', payload: { id: 'r1', kind: 'parentChild' } },
      stateBefore,
    );
    expect(label).toBe('Usunięto relację: Anna X → Jan X');
  });

  it('REMOVE_RELATIONSHIP (marriage) — rozwiązuje oboje małżonków', () => {
    const stateBefore: FamilyState = {
      people: [person('p1', 'Anna', 'X'), person('p2', 'Jan', 'X')],
      parentChildRelationships: [],
      marriages: [{ id: 'm1', spouse1Id: 'p1', spouse2Id: 'p2', marriageDate: null, divorceDate: null }],
    };
    const label = describeAction(
      { type: 'REMOVE_RELATIONSHIP', payload: { id: 'm1', kind: 'marriage' } },
      stateBefore,
    );
    expect(label).toBe('Usunięto małżeństwo: Anna X ⚭ Jan X');
  });

  it('IMPORT_DATA — liczy osoby z payloadu', () => {
    const payload: FamilyState = {
      people: [person('p1', 'A', 'B'), person('p2', 'C', 'D'), person('p3', 'E', 'F')],
      parentChildRelationships: [],
      marriages: [],
    };
    const label = describeAction({ type: 'IMPORT_DATA', payload }, emptyState);
    expect(label).toBe('Zaimportowano dane (3 osób)');
  });

  it('CLEAR_DATA — stały tekst', () => {
    const label = describeAction({ type: 'CLEAR_DATA' }, emptyState);
    expect(label).toBe('Wyczyszczono wszystkie dane');
  });
});
