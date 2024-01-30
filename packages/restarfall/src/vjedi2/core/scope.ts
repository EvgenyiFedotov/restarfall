import { Event } from "./event";
import { Store } from "./store";

interface Frame<Value> {
  value?: Value;
}

interface EventMeta<Payload> {
  called: boolean;
  payload: Frame<Payload>;
}

interface Scope {
  payloads: Map<Event<unknown>, unknown>;
  values: Map<Store<unknown>, unknown>;
  calledEvent: Event<unknown> | null;
}

const createScope = (): Scope => ({
  payloads: new Map(),
  calledEvent: null,
  values: new Map(),
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

export type { Frame, EventMeta, Scope };
export { createScope, getPayload, getEventMeta, getValue };
