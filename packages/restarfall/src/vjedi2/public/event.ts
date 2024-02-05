import {
  Event as CoreEvent,
  createEvent as createCoreEvent,
} from "../core/event";

interface Event<Payload> {
  readonly type: "event";
  readonly value?: Payload; // Need for resolve types
}

const events: WeakMap<Event<unknown>, CoreEvent<unknown>> = new WeakMap();

const createEvent = <Payload>(): Event<Payload> => {
  const event: Event<Payload> = { type: "event" };
  const coreEvent = createCoreEvent<Payload>();

  events.set(event, coreEvent);

  return event;
};

const getCoreEvent = <Payload>(event: Event<Payload>): CoreEvent<Payload> => {
  if (events.has(event)) return events.get(event) as CoreEvent<Payload>;

  throw new Error("Event is incorrect");
};

const isEvent = <Payload>(value: unknown): value is Event<Payload> => {
  return events.has(value as never);
};

export type { Event };
export { createEvent, getCoreEvent, isEvent };
