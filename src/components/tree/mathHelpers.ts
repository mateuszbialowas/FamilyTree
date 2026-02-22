// ======================== MATH UTILITIES ========================
// Seeded random, interpolation, and array pick — used by geometry generation

/** Create a seeded pseudo-random number generator (linear congruential) */
export function sr(seed: number) {
  let s = seed || 42;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Linear interpolation between a and b at position t (0..1) */
export function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

/** Pick a random element from an array using a seeded random function */
export function pick<T>(a: T[], r: () => number): T { return a[Math.floor(r() * a.length)]; }
