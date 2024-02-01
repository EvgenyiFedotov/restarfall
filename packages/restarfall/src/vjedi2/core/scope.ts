import { Event } from "./event";
import { Store } from "./store";

interface Frame<Value> {
  value?: Value;
}

interface EventMeta<Payload> {
  called: boolean;
  payload: Frame<Payload>;
}

interface CalledEvent<Value> {
  scope: Scope;
  key: Event<Value> | Store<Value>;
  value: Value;
}

interface Scope {
  payloads: Map<Event<unknown>, unknown>;
  values: Map<Store<unknown>, unknown>;
  queue: CalledEvent<unknown>[];
  calledEvent: Event<unknown> | null;
  promises: Set<Promise<unknown>>;
}

const createScope = (): Scope => ({
  payloads: new Map(),
  calledEvent: null,
  queue: [],
  values: new Map(),
  promises: new Set(),
});

const getPayload = <Payload>(
  scope: Scope,
  event: Event<Payload>,
): Frame<Payload> => {
  return scope.payloads.has(event)
    ? { value: scope.payloads.get(event) as Payload }
    : {};
};

const getEventMeta = <Payload>(
  scope: Scope,
  event: Event<Payload>,
): EventMeta<Payload> => ({
  called: scope.calledEvent === event,
  payload: getPayload(scope, event),
});

const getValue = <Value>(scope: Scope, store: Store<Value>): Frame<Value> => {
  return scope.values.has(store)
    ? { value: scope.values.get(store) as Value }
    : {};
};

const wait = async (scope: Scope): Promise<void> => {
  let promises = Array.from(scope.promises);

  while (promises.length > 0) {
    await Promise.allSettled(promises);
    promises.forEach((promise) => scope.promises.delete(promise));
    promises = Array.from(scope.promises);
  }
};

export type { Frame, EventMeta, Scope };
export { createScope, getPayload, getEventMeta, getValue, wait };
