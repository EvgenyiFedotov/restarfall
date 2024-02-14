import { Event } from "./types";

const events: WeakSet<Event<unknown>> = new WeakSet();

const createEvent = <P>(): Event<P> => {
  const event: Event<P> = { type: "event" };

  events.add(event);

  return event;
};

const isEvent = <P>(value: unknown): value is Event<P> => {
  return events.has(value as never);
};

export { createEvent, isEvent };
