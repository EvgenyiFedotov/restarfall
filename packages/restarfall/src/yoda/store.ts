import { createEvent } from "./event";
import { Store, StoreState, StoreKey, Converter } from "./types";

interface Options<V> extends Converter<V> {
  key: StoreKey;
}

const stores: WeakMap<Store<unknown>, StoreState<unknown>> = new WeakMap();

const converters: Map<StoreKey, Converter<unknown> | null> = new Map();

const createStore = <V>(value: V, options?: Options<V>): Store<V> => {
  const store: Store<V> = { type: "store" };
  const state: StoreState<V> = { value, changed: createEvent() };

  if (options) {
    state.key = options.key;

    if (converters.has(options.key)) {
      converters.set(options.key, null);
    } else {
      converters.set(options.key, {
        serialize: options.serialize as never,
        deserialize: options.deserialize,
      });
    }
  }

  stores.set(store, state);

  return store;
};

const isStore = <V>(value: unknown): value is Store<V> => {
  return stores.has(value as never);
};

const getStoreState = <V>(store: Store<V>): StoreState<V> => {
  if (stores.has(store)) return stores.get(store) as StoreState<V>;

  throw new Error("Store is incorrect");
};

const getInitialValue = <V>(store: Store<V>): V => {
  return getStoreState(store).value;
};

const getStoreMeta = <V>(
  store: Store<V>,
): { key: StoreKey; converter: Converter<V> } | null => {
  const state = getStoreState(store);

  if (!state.key) return null;

  const converter = converters.get(state.key);

  if (!converter) return null;

  return {
    key: state.key,
    converter: converter as Converter<V>,
  };
};

export { createStore, isStore, getStoreState, getInitialValue, getStoreMeta };
