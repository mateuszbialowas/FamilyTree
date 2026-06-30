import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FamilyState } from '../types';

const STORAGE_KEY = '@family_tree_data';
const ROOT_KEY = '@family_tree_root';

/** The person id the user last chose as the tree root (persists across launches). */
export async function loadRootId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(ROOT_KEY);
  } catch (e) {
    console.error('Failed to load root id:', e);
    return null;
  }
}

export async function saveRootId(rootId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ROOT_KEY, rootId);
  } catch (e) {
    console.error('Failed to save root id:', e);
  }
}

export async function loadData(): Promise<FamilyState | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return null;
    return JSON.parse(json) as FamilyState;
  } catch (e) {
    console.error('Failed to load data:', e);
    return null;
  }
}

export async function saveData(state: FamilyState): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export async function clearData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear data:', e);
  }
}
