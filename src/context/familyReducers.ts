import type { FamilyState, FamilyAction } from '../types';
import { describeAction } from '../utils/describeAction';

export const initialFamilyState: FamilyState = {
  people: [],
  parentChildRelationships: [],
  marriages: [],
};

export const HISTORY_LIMIT = 50;

export type HistoryEntry = {
  state: FamilyState;
  label: string;
  timestamp: number;
};

export type HistoryState = {
  past: HistoryEntry[];
  present: HistoryEntry;
  future: HistoryEntry[];
};

export type HistoryAction =
  | { type: 'APPLY'; action: FamilyAction; now: number }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'RESET'; payload: FamilyState; label: string; now: number }
  | { type: 'JUMP'; direction: 'past' | 'future'; index: number };

export function createInitialHistory(now: number = Date.now()): HistoryState {
  return {
    past: [],
    present: { state: initialFamilyState, label: 'Stan początkowy', timestamp: now },
    future: [],
  };
}

export function familyReducer(state: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case 'ADD_PERSON':
      return { ...state, people: [...state.people, action.payload] };

    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'DELETE_PERSON': {
      const id = action.payload;
      return {
        ...state,
        people: state.people.filter((p) => p.id !== id),
        parentChildRelationships: state.parentChildRelationships.filter(
          (r) => r.parentId !== id && r.childId !== id
        ),
        marriages: state.marriages.filter(
          (m) => m.spouse1Id !== id && m.spouse2Id !== id
        ),
      };
    }

    case 'ADD_PARENT_CHILD':
      return {
        ...state,
        parentChildRelationships: [
          ...state.parentChildRelationships,
          action.payload,
        ],
      };

    case 'ADD_MARRIAGE':
      return { ...state, marriages: [...state.marriages, action.payload] };

    case 'REMOVE_RELATIONSHIP':
      if (action.payload.kind === 'parentChild') {
        return {
          ...state,
          parentChildRelationships: state.parentChildRelationships.filter(
            (r) => r.id !== action.payload.id
          ),
        };
      }
      return {
        ...state,
        marriages: state.marriages.filter((m) => m.id !== action.payload.id),
      };

    case 'IMPORT_DATA':
      return action.payload;

    case 'CLEAR_DATA':
      return initialFamilyState;

    default:
      return state;
  }
}

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case 'APPLY': {
      const next = familyReducer(state.present.state, action.action);
      if (next === state.present.state) return state;
      const entry: HistoryEntry = {
        state: next,
        label: describeAction(action.action, state.present.state),
        timestamp: action.now,
      };
      const past = [...state.past, state.present].slice(-HISTORY_LIMIT);
      return { past, present: entry, future: [] };
    }

    case 'UNDO': {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return { past: newPast, present: previous, future: [state.present, ...state.future] };
    }

    case 'REDO': {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return { past: [...state.past, state.present], present: next, future: newFuture };
    }

    case 'RESET': {
      const entry: HistoryEntry = {
        state: action.payload,
        label: action.label,
        timestamp: action.now,
      };
      return { past: [], present: entry, future: [] };
    }

    case 'JUMP': {
      if (action.direction === 'past') {
        if (action.index < 0 || action.index >= state.past.length) return state;
        const target = state.past[action.index];
        const movedToFuture = state.past.slice(action.index + 1);
        return {
          past: state.past.slice(0, action.index),
          present: target,
          future: [...movedToFuture, state.present, ...state.future],
        };
      }
      // future
      if (action.index < 0 || action.index >= state.future.length) return state;
      const target = state.future[action.index];
      const movedToPast = state.future.slice(0, action.index);
      return {
        past: [...state.past, state.present, ...movedToPast],
        present: target,
        future: state.future.slice(action.index + 1),
      };
    }

    default:
      return state;
  }
}
