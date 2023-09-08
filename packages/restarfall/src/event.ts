interface Event<Value> {
  readonly type: "event";
  readonly key: string | null;
  readonly value?: Value;
}

const createEvent = <Value>(options?: {
  key?: string | null;
}): Event<Value> => {
  return { type: "event", key: options?.key ?? null };
};

export type { Event };
export { createEvent };
