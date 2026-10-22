// Save and resume with localStorage. Storage can be missing or blocked (private
// windows, blocked site data), so every access is wrapped and failure is not fatal.

const KEY = 'lifepath.save';

export function loadSave(version) {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const state = JSON.parse(raw);
    return state && state.version === version ? state : null;
  } catch {
    return null;
  }
}

export function writeSave(state) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearSave() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}
