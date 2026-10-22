// Keyed randomness. The same seed and key always produce the same number, so a
// replay with a different family background meets the same chance events, and a
// saved game resumes exactly.

export function newSeed() {
  return Math.floor(Math.random() * 2147483647);
}

// cyrb53: a small, well-distributed 53-bit string hash.
function hash53(str) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// A number in [0, 1) for this seed and key.
export function uniform(seed, key) {
  return hash53(`${seed}:${key}`) / 9007199254740992;
}
