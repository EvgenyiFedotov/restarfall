import { getStoreMeta } from "./store";
import { Event, EventMeta, Frame, Scope, Store } from "./types";

const createScope = (): Scope => ({
  payloads: new Map(),
  values: new Map(),
  actions: [],
  currentEvent: null,
  promises: new Set(),
  listeners: new Map(),
  rawData: {},
});

const getPayload = <P>(scope: Scope, event: Event<P>): Frame<P> => {
  return scope.payloads.has(event)
    ? { value: scope.payloads.get(event) as P }
    : {};
};

const getEventMeta = <P>(scope: Scope, event: Event<P>): EventMeta<P> => ({
  called: scope.currentEvent === event,
  payload: getPayload(scope, event),
});

const getValue = <V>(scope: Scope, store: Store<V>): Frame<V> => {
  if (scope.values.has(store)) return { value: scope.values.get(store) as V };

  const meta = getStoreMeta(store);

  if (meta) {
    const value = meta.converter.deserialize(scope.rawData[meta.key]);

    scope.values.set(store, value);

    return { value };
  }

  return {};
};

export { createScope, getPayload, getEventMeta, getValue };
