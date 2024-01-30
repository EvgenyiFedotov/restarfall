import { Event, createEvent } from "./event";

interface Store<Value> {
  initialValue: Value;
  changed: Event<Value>;
}

const createStore = <Value>(initialValue: Value): Store<Value> => ({
  initialValue,
  changed: createEvent(),
});

export type { Store };
export { createStore };
