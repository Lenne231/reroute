export type SerializableValue =
  | null
  | boolean
  | number
  | string
  | SerializableValue[]
  | { [key: string]: SerializableValue };

export type HydrationState = Record<string, SerializableValue>;

const hydrationCache = new Map<string, SerializableValue>();

export function hydrateInitialState(state?: HydrationState) {
  hydrationCache.clear();

  if (!state) {
    return;
  }

  for (const [key, value] of Object.entries(state)) {
    hydrationCache.set(key, value);
  }
}

export function dehydrateInitialState(): HydrationState {
  return Object.fromEntries(hydrationCache.entries());
}

export async function getHydratedValue<T extends SerializableValue>(
  key: string,
  loader: () => Promise<T> | T,
): Promise<T> {
  if (hydrationCache.has(key)) {
    return hydrationCache.get(key) as T;
  }

  const value = await loader();
  hydrationCache.set(key, value);
  return value;
}
