import { Event, createEvent } from "./event";

interface Store<Value> {
  initialValue: Value;
  changed: Event<Value>;
}

const createStore = <Value>(
  initialValue: Value,
  changed: Event<Value> = createEvent(),
): Store<Value> => ({
  initialValue,
  changed,
});

export type { Store };
export { createStore };
