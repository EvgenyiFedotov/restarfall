import { privateLogger } from "./private-root";

interface Event<Value> {
  readonly type: "event";
  readonly key: string | null;
  readonly value?: Value; // Need for resolve types
}

interface CreateEventOptions {
  key?: string | null;
}

interface CreateEvent {
  <Value>(options?: CreateEventOptions): Event<Value>;
}

const events: WeakSet<Event<unknown>> = new WeakSet();

const createEvent: CreateEvent = <Value>(options?: CreateEventOptions) => {
  const event: Event<Value> = { type: "event", key: options?.key ?? null };

  events.add(event);
  privateLogger.add({ action: "event-created", meta: { event } });

  return event;
};

export type { Event, CreateEvent };
export { events, createEvent };
