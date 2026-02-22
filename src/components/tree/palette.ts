// ======================== TREE VISUAL PALETTE ========================
// All color constants used by tree rendering (bark, leaves, animals, UI elements)

export const P = {
  bark: {
    deep: '#1C0F05', shadow: '#2E1B0E', dark: '#3E2723',
    mid: '#5D4037', light: '#795548', highlight: '#A1887F',
    edge: '#4A3728',
  },
  leaf: {
    deep: '#1B5E20', darkA: '#2E7D32', darkB: '#33691E',
    midA: '#388E3C', midB: '#43A047', midC: '#558B2F',
    lightA: '#66BB6A', lightB: '#7CB342', lightC: '#81C784',
    bright: '#8BC34A', highlight: '#AED581',
  },
  moss: ['#6B8E23', '#556B2F', '#7B9F35', '#8FBC8F'],
  cream: '#fdf6e3', parch: '#f4e8c1', parchDk: '#e6d5a8', parchEdge: '#d4c08f',
  ink: '#3b2a1a', inkFade: '#8b7a6a',
  sepia: '#8b6914', sepiaLt: '#c4a035', red: '#8b3a2a',
  owl: { body: '#7B6B5A', bodyDk: '#5C4D3C', breast: '#C4B098', face: '#D4C4A8', eye: '#F5C518', eyeRing: '#E8B50A', pupil: '#1A1A1A', beak: '#C49A2A', feet: '#9E8E6E' },
  bird: { body: '#C75B4A', bodyDk: '#A04535', breast: '#E8A870', wing: '#8B4535', wingDk: '#6B3025', tail: '#7B3B2B', beak: '#E8B040', eye: '#1A1A1A' },
  squirrel: { body: '#A0622A', bodyDk: '#7A4A1E', belly: '#D4A860', tail: '#8B5220', tailLight: '#C08040', ear: '#C48838', nose: '#2A1A0A', eye: '#1A1A1A' },
  hl: { ring: '#DAA520', glow: 'rgba(218,165,32,0.25)' },
  // Shared shadow/transparency colors (extracted from inline values)
  shadow: {
    trunk: 'rgba(15,8,0,0.1)',
    branch: 'rgba(15,8,0,0.07)',
    node: 'rgba(20,10,0,0.1)',
    animal: 'rgba(0,0,0,0.07)',
  },
};

// ======================== LEAF & ANIMAL TYPES ========================

export interface LeafD {
  x: number; y: number; sz: number; rot: number;
  col: string; type: number; op: number; layer: number;
}

export interface AnimalD {
  type: 'owl' | 'bird' | 'squirrel';
  x: number; y: number; flip: boolean; seed: number;
}
