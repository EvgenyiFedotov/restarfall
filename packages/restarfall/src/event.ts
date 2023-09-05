// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface Event<Value> {
  readonly type: "event";
  readonly key: string | null;
}

export const createEvent = <Value>(options?: {
  key?: string | null;
}): Event<Value> => {
  return { type: "event", key: options?.key ?? null };
};
