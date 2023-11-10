import { Event, createEvent } from "./event";
import { privateLogger } from "./private-root";

interface Store<Value> {
  readonly type: "store";
  readonly key?: string | null;
  readonly initialValue: Value;
  readonly changed: Event<Value>;
}

interface CreateStoreOptions {
  key?: string | null;
}

interface CreateStore {
  <Value>(value: Value, options?: CreateStoreOptions): Store<Value>;
}

const stores: WeakSet<Store<unknown>> = new WeakSet();

const createStore: CreateStore = <Value>(
  value: Value,
  options?: CreateStoreOptions,
) => {
  let changed: Event<Value> | null = null;

  const store: Store<Value> = {
    type: "store",
    key: options?.key ?? null,
    initialValue: value,
    get changed() {
      changed =
        changed ??
        createEvent<typeof value>({
          key: options?.key ? `${options.key}_changed` : null,
        });

      return changed;
    },
  };

  stores.add(store);
  privateLogger.add({ action: "store-created", meta: { store } });

  return store;
};

const isStore = <Value>(value: unknown): value is Store<Value> => {
  return stores.has(value as never);
};

export type { Store, CreateStore };
export { stores, createStore, isStore };
