import { Event, createEvent } from "./event";

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

const createStore: CreateStore = (value, options) => {
  let changed: Event<typeof value> | null = null;

  return {
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
};

export type { Store, CreateStore };
export { createStore };
