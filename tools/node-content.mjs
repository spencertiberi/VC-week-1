// Loads the site content from disk for the Node tools.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { loadContent } from '../engine/loader.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function readJson(p) {
  return readFile(path.join(ROOT, p), 'utf8').then((text) => {
    try {
      return JSON.parse(text);
    } catch (err) {
      throw new Error(`${p}: ${err.message}`);
    }
  });
}

export const loadNodeContent = () => loadContent(readJson);
