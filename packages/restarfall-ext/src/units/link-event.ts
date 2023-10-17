import { Event, UnitElement, create, use } from "restarfall";

interface LinkEvent {
  <Payload>(from: Event<Payload>, to: Event<Payload>): UnitElement;
}

const linkEvent: LinkEvent = create.unit((from, to) => {
  if (from === to) return null;

  const eventState = use.depend(from);

  if (eventState.called && "payload" in eventState) {
    use.dispatch(to)(eventState.payload as never);
  }

  return null;
});

export type { LinkEvent };
export { linkEvent };
