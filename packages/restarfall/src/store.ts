import { Event, createEvent } from "./event";

interface Store<Value> {
  readonly type: "store";
  readonly key?: string | null;
  readonly initialValue: Value;
  readonly changed: Event<Value>;
}

const createStore = <Value>(
  value: Value,
  options?: { key?: string | null },
): Store<Value> => {
  let changed: Event<Value> | null = null;

  return {
    type: "store",
    key: options?.key ?? null,
    initialValue: value,
    get changed() {
      changed =
        changed ??
        createEvent<Value>({
          key: options?.key ? `${options.key}_changed` : null,
        });

      return changed;
    },
  };
};

export type { Store };
export { createStore };
