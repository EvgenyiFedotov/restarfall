import {
  Store as CoreStore,
  createStore as createCoreStore,
} from "../core/store";

interface Store<Value> {
  readonly type: "store";
  readonly value?: Value; // Need for resolve types
}

const stores: WeakMap<Store<unknown>, CoreStore<unknown>> = new WeakMap();

const createStore = <Value>(value: Value): Store<Value> => {
  const store: Store<Value> = { type: "store" };
  const coreStore = createCoreStore<Value>(value);

  stores.set(store, coreStore);

  return store;
};

const getCoreStore = <Value>(store: Store<Value>): CoreStore<Value> => {
  if (stores.get(store)) return stores.get(store) as CoreStore<Value>;

  throw new Error("Store is incorrect");
};

const getInitialValue = <Value>(store: Store<Value>): Value => {
  return getCoreStore(store).initialValue;
};

const isStore = <Value>(value: unknown): value is Store<Value> => {
  return stores.has(value as never);
};

export type { Store };
export { createStore, getCoreStore, getInitialValue, isStore };
