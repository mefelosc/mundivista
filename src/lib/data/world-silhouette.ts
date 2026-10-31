import raw from './generated/world-silhouette.json';

const data = raw as unknown as { retrieved: string; path: string };

/** Contorno do mundo em viewBox 0 0 100 100, para a landing e fundos editoriais. */
export const worldOutline = data.path;
