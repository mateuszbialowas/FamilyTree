import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import * as Linking from 'expo-linking';
import type { FamilyState, FamilyAction } from '../types';
import { loadData, saveData } from '../utils/storage';
import {
  historyReducer,
  createInitialHistory,
  type HistoryEntry,
} from './familyReducers';
import i18n from 'i18next';
import { setLocale, SUPPORTED_LOCALE_CODES, type Locale } from '../i18n';
import { getSampleFamily } from '../utils/sampleFamilies';
import { getMarketingFamily } from '../utils/marketingFamilies';
import {
  setInitialTreeZoom,
  setInitialTreeRootName,
  setInitialTreeRootId,
} from '../utils/screenshotMode';

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
  const pendingDeepLink = useRef<string | null>(null);
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

  // Apply a load-sample deep link. Switches locale + dispatches IMPORT_DATA.
  // No-op for unrecognized URLs.
  const applyDeepLink = useCallback(
    (url: string) => {
      const match = url.match(/load-(sample|marketing)\/([a-z]{2})/i);
      if (!match) return;
      const kind = match[1] as 'sample' | 'marketing';
      const locale = match[2] as Locale;
      if (!SUPPORTED_LOCALE_CODES.includes(locale)) return;
      const zoomMatch = url.match(/[?&]zoom=([0-9.]+)/);
      if (zoomMatch) {
        const z = parseFloat(zoomMatch[1]);
        if (Number.isFinite(z) && z > 0) setInitialTreeZoom(z);
      }
      const rootIdMatch = url.match(/[?&]rootId=([^&]+)/);
      if (rootIdMatch) {
        setInitialTreeRootId(decodeURIComponent(rootIdMatch[1]));
      }
      const rootNameMatch = url.match(/[?&]rootName=([^&]+)/);
      if (rootNameMatch) {
        setInitialTreeRootName(decodeURIComponent(rootNameMatch[1]));
      }
      setLocale(locale);
      const payload = kind === 'marketing'
        ? getMarketingFamily(locale)
        : getSampleFamily(locale);
      dispatch({ type: 'IMPORT_DATA', payload });
    },
    [dispatch],
  );

  // Load saved data on mount, then process any deep link that arrived
  // while the load was in flight. Loading first prevents loadData from
  // overwriting the deep-link import when both fire on cold launch.
  useEffect(() => {
    (async () => {
      const saved = await loadData();
      if (saved) {
        historyDispatch({
          type: 'RESET',
          payload: saved,
          label: i18n.t('history.loadedLabel'),
          now: Date.now(),
        });
      }
      isInitialized.current = true;
      setIsLoading(false);
      if (pendingDeepLink.current) {
        applyDeepLink(pendingDeepLink.current);
        pendingDeepLink.current = null;
      }
    })();
  }, [applyDeepLink]);

  // Deep-link handler. Query params (all optional, can combine):
  //   ?zoom=<float>        — initial canvas zoom (e.g. 0.55 to fit more)
  //   ?rootId=<urlencoded> — exact person id (preferred for automation)
  //   ?rootName=<urlencoded> — "FirstName LastName" (locale-specific)
  // Routes:
  //   family-tree://load-sample/<locale>
  //   family-tree://load-marketing/<locale>
  // Used by the Maestro screenshot flow; the same import is also
  // available to users via Settings → Load sample family. URLs that
  // arrive before loadData() finishes are queued and applied after.
  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      if (!isInitialized.current) {
        pendingDeepLink.current = url;
        return;
      }
      applyDeepLink(url);
    };
    Linking.getInitialURL().then(handleUrl);
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [applyDeepLink]);

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
