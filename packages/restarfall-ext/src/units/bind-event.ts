import { Event, Unit, UnitElement, create, use } from "restarfall";

interface BindEvent {
  <Payload>(event: Event<Payload>, handler: Unit<[Payload]>): UnitElement;
  <Payload extends object, Extra extends Partial<Payload> = Partial<Payload>>(
    event: Event<{
      [Key in Exclude<keyof Payload, keyof Extra>]: Payload[Key];
    }>,
    handler: Unit<[Payload]>,
    extra: Extra,
  ): UnitElement;
}

const bindEvent: BindEvent = create.unit((event, handler, extra?: unknown) => {
  const eventState = use.depend(event);

  if (eventState.called && "payload" in eventState) {
    if (typeof extra === "object" && extra !== null) {
      return [handler({ ...eventState.payload, ...extra } as never)];
    }

    return [handler(eventState.payload as never)];
  }

  return null;
});

export type { BindEvent };
export { bindEvent };
