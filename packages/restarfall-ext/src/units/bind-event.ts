import { Event, Unit, UnitElement, create, use } from "restarfall";

// BindEvent

interface BindEvent {
  <Payload>(event: Event<Payload>, handler: Unit<[Payload]>): UnitElement;
}

const bindEvent: BindEvent = create.unit((event, handler) => {
  const eventState = use.depend(event);

  if (eventState.called && "payload" in eventState) {
    return [handler(eventState.payload as never)];
  }

  return null;
});

export type { BindEvent };
export { bindEvent };
