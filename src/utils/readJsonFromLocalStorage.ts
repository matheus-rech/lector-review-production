/**
 * Reads a JSON value out of localStorage, falling back when the key is absent,
 * holds something that is not valid JSON, or holds a bare null.
 *
 * State initializers call this during render, so an unguarded JSON.parse on a
 * corrupted or legacy value would throw there and take the whole app down with
 * no way back for the user short of clearing site data. A stored null parses
 * fine but is never a usable value for a caller expecting a list or an object,
 * so it takes the fallback too.
 */
export const readJsonFromLocalStorage = <T>(key: string, fallback: T): T => {
  const saved = localStorage.getItem(key);
  if (saved === null) return fallback;

  try {
    const parsed = JSON.parse(saved) as T | null;
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
};
