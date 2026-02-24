import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState } from 'react';
import type { FamilyState, FamilyAction } from '../types';
import { loadData, saveData } from '../utils/storage';

/** Assign sample portrait URLs to people without photos */
function assignSamplePhotos(state: FamilyState): FamilyState {
  let changed = false;
  const people = state.people.map(p => {
    if (p.photoUri !== undefined) return p;
    changed = true;
    // Derive a stable number 0-99 from person id
    let h = 0;
    for (let i = 0; i < p.id.length; i++) h = ((h << 5) - h + p.id.charCodeAt(i)) | 0;
    const idx = Math.abs(h) % 100;
    const folder = p.gender === 'male' ? 'men' : 'women';
    return { ...p, photoUri: `https://randomuser.me/api/portraits/${folder}/${idx}.jpg` };
  });
  return changed ? { ...state, people } : state;
}

const initialState: FamilyState = {
  people: [],
  parentChildRelationships: [],
  marriages: [],
};

function familyReducer(state: FamilyState, action: FamilyAction): FamilyState {
  switch (action.type) {
    case 'ADD_PERSON':
      return assignSamplePhotos({ ...state, people: [...state.people, action.payload] });

    case 'UPDATE_PERSON':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };

    case 'CLEAR_PHOTO':
      return {
        ...state,
        people: state.people.map((p) =>
          p.id === action.payload ? { ...p, photoUri: null } : p
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
      return initialState;

    default:
      return state;
  }
}

type FamilyContextValue = {
  state: FamilyState;
  dispatch: React.Dispatch<FamilyAction>;
  isLoading: boolean;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(familyReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load data on mount
  useEffect(() => {
    (async () => {
      const saved = await loadData();
      if (saved) {
        dispatch({ type: 'IMPORT_DATA', payload: assignSamplePhotos(saved) });
      }
      isInitialized.current = true;
      setIsLoading(false);
    })();
  }, []);

  // Debounced save on state change
  useEffect(() => {
    if (!isInitialized.current) return;

    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
    }
    saveTimeout.current = setTimeout(() => {
      saveData(state);
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [state]);

  return (
    <FamilyContext.Provider value={{ state, dispatch, isLoading }}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
