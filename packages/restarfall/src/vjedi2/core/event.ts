interface Event<Payload> {
  readonly type: "event";
  readonly value?: Payload; // Need for resolve types
}

const createEvent = <Payload>(): Event<Payload> => ({ type: "event" });

export type { Event };
export { createEvent };
