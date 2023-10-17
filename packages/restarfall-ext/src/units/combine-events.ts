import { Event, UnitElement, create, use } from "restarfall";

interface CombineEvents {
  <Values extends Record<string, unknown>, Result>(params: {
    events: { [Key in keyof Values]: Event<Values[Key]> };
    fn: (values: Partial<Values>) => Result;
    target: Event<Result>;
  }): UnitElement;
  <Values extends Record<string, unknown>>(params: {
    events: { [Key in keyof Values]: Event<Values[Key]> };
    target: Event<Partial<Values>>;
  }): UnitElement;
}

const combineEvents: CombineEvents = create.unit((params) => {
  const stateEvents = Object.entries(params.events).reduce(
    (memo, [key, event]) => {
      const eventState = use.depend(event);

      memo.called = memo.called || eventState.called;

      if (eventState.called) memo.payload[key] = eventState.payload;

      return memo;
    },
    { called: false, payload: {} } as {
      called: boolean;
      payload: Partial<Record<string, unknown>>;
    },
  );

  if (!stateEvents.called) return null;

  const fn = "fn" in params ? params.fn : null;
  const callTarget = use.dispatch(params.target);

  if (fn instanceof Function) {
    callTarget(fn(stateEvents.payload));
  } else {
    callTarget(stateEvents.payload);
  }

  return null;
});

export type { CombineEvents };
export { combineEvents };
