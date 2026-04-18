import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { FamilyState, FamilyAction } from '../types';
import { loadData, saveData } from '../utils/storage';
import {
  historyReducer,
  createInitialHistory,
  type HistoryEntry,
} from './familyReducers';
import { t } from '../i18n';

export type { HistoryEntry } from './familyReducers';

type FamilyContextValue = {
  state: FamilyState;
  dispatch: React.Dispatch<FamilyAction>;
  isLoading: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  pastEntries: readonly HistoryEntry[];
  futureEntries: readonly HistoryEntry[];
  presentEntry: HistoryEntry;
  jumpTo: (target: { direction: 'past' | 'future'; index: number }) => void;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const [history, historyDispatch] = useReducer(historyReducer, undefined, () =>
    createInitialHistory(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const isInitialized = useRef(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useCallback<React.Dispatch<FamilyAction>>((action) => {
    historyDispatch({ type: 'APPLY', action, now: Date.now() });
  }, []);

  const undo = useCallback(() => historyDispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => historyDispatch({ type: 'REDO' }), []);
  const jumpTo = useCallback(
    (target: { direction: 'past' | 'future'; index: number }) => {
      historyDispatch({ type: 'JUMP', direction: target.direction, index: target.index });
    },
    [],
  );

  // Load data on mount
  useEffect(() => {
    (async () => {
      const saved = await loadData();
      if (saved) {
        historyDispatch({
          type: 'RESET',
          payload: saved,
          label: t.history.loadedLabel,
          now: Date.now(),
        });
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
      saveData(history.present.state);
    }, 500);

    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [history.present]);

  const value = useMemo<FamilyContextValue>(() => ({
    state: history.present.state,
    dispatch,
    isLoading,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    pastEntries: history.past,
    futureEntries: history.future,
    presentEntry: history.present,
    jumpTo,
  }), [history, dispatch, isLoading, undo, redo, jumpTo]);

  return (
    <FamilyContext.Provider value={value}>
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error('useFamily must be used within FamilyProvider');
  return ctx;
}
