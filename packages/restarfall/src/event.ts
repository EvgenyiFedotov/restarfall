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

const createEvent: CreateEvent = (options) => {
  return { type: "event", key: options?.key ?? null };
};

export type { Event, CreateEvent };
export { createEvent };
