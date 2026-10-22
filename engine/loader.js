// Loads every content and data file named in content/manifest.json.
// `readJson(path)` takes a path relative to the site root, so the browser can use
// fetch and the Node tools can use fs.

export async function loadContent(readJson) {
  const manifest = await readJson('content/manifest.json');
  const [rules, ui, eventsFile, stages, dataEntries] = await Promise.all([
    readJson(`content/${manifest.rules}`),
    readJson(`content/${manifest.ui}`),
    readJson(`content/${manifest.events}`),
    Promise.all(manifest.stages.map((f) => readJson(`content/${f}`))),
    Promise.all(manifest.data.map(async (name) => [name, await readJson(`content/data/${name}.json`)])),
  ]);
  const data = Object.fromEntries(dataEntries);
  const scenes = {};
  stages.forEach((stage, stageIndex) => {
    for (const scene of stage.scenes) scenes[scene.id] = { ...scene, stageIndex };
  });
  const sources = Object.fromEntries(data.sources.sources.map((s) => [s.id, s]));
  return { manifest, rules, ui, events: eventsFile.events, stages, scenes, data, sources };
}

export function browserReadJson(path) {
  return fetch(`./${path}`).then((res) => {
    if (!res.ok) throw new Error(`Could not load ${path} (${res.status})`);
    return res.json();
  });
}
