import * as restarfall from "../index";

const $stack = restarfall.createStore<restarfall.ComponentElement[]>([]);
const root = restarfall.createComponent(() =>
  restarfall.useValue($stack, true),
);
const shape = restarfall.createShape();
shape.attach(root());

// Event
interface Event<Payload> {
  type: "event";
  (payload: Payload): void;
}

const events: WeakMap<Event<any>, restarfall.Event<any>> = new WeakMap();

const createEvent = <Payload>(): Event<Payload> => {
  const restarfallEvent = restarfall.createEvent<Payload>();
  const event: Event<Payload> = (payload) => {
    shape.callEvent(restarfallEvent, payload);
  };

  event.type = "event";

  events.set(event, restarfallEvent);

  return event;
};

// Store
interface Store<Value> {
  type: "store";
  getState(): Value;
  on<Payload>(
    unit: Event<Payload>,
    fn: (state: Value, payload: Payload) => Value,
  ): Store<Value>;
}

const stores: WeakMap<Store<any>, restarfall.Store<any>> = new WeakMap();

const createStore = <Value>(initialState: Value): Store<Value> => {
  const restarfallStore = restarfall.createStore<Value>(initialState);
  const store: Store<Value> = {
    type: "store",
    getState: () => shape.getValue(restarfallStore),
    on: (unit, fn) => {
      const _event = events.get(unit);

      if (!_event) throw new Error("Unit is incorrect");

      const component = restarfall.createComponent(() => {
        const eventState = restarfall.useDepend(_event);
        const payloadState =
          "payload" in eventState ? { payload: eventState.payload } : null;
        const state = restarfall.useValue(restarfallStore);

        if (eventState.called && payloadState) {
          shape.changeValue(restarfallStore, fn(state, payloadState.payload));
        }

        return null;
      });

      shape.changeValue($stack, [...shape.getValue($stack), component()]);

      return store;
    },
  };

  stores.set(store, restarfallStore);

  return store;
};

const isStore = <Value>(value: unknown): value is Store<Value> => {
  return !!value;
};

// Effect
type PromiseValue<T> = T extends PromiseLike<infer U> ? U : T;

interface Effect<Params = void, Result = unknown, Error = unknown> {
  type: "effect";
  (params: Params): Result;
  done: Event<{
    params: Params;
    result: Result extends Promise<any> ? PromiseValue<Result> : Result;
  }>;
  fail: Event<{ params: Params; error: Error }>;
}

const createEffect = <Params = void, Result = unknown, Error = unknown>(
  fn: (param: Params) => Result,
) => {
  const effect: Effect<Params, Result, Error> = (params) => {
    try {
      const result: any = fn(params);

      if (result instanceof Promise) {
        result
          .then((result) => effect.done({ params, result }))
          .catch((error) => effect.fail({ params, error }));
      } else {
        effect.done({ params, result });
      }

      return result;
    } catch (error) {
      effect.fail({ params, error });
      throw error;
    }
  };

  effect.type = "effect";
  effect.done = createEvent();
  effect.fail = createEvent();

  return effect;
};

// Combine
type Data<Values extends Record<string, unknown>> = {
  [K in keyof Values]: Store<Values[K]>;
};

const combine = <Values extends Record<string, unknown>, Result>(
  data: Data<Values>,
  fn: (data: Values) => Result,
): Store<Result> => {
  const store = createStore<Result>(
    fn(
      Object.fromEntries(
        Object.entries(data).map(([key, store]) => [
          key,
          isStore(store) ? store.getState() : undefined,
        ]),
      ) as Values,
    ),
  );

  const restarfallComponent = restarfall.createComponent(() => {
    const restarfallStores = Object.entries(data).map(([key, store]) => [
      key,
      stores.get(store),
    ]) as [string, restarfall.Store<any>][];

    const depends = restarfallStores.map(([key, store]) => [
      key,
      restarfall.useDepend(store),
    ]) as [string, restarfall.CalledEventState<any>][];

    const isCalled = depends.reduce<boolean>((memo, [, state]) => {
      return memo || state.called;
    }, false);

    if (!isCalled) return null;

    const result = fn(
      Object.fromEntries(
        restarfallStores.map(([key, store]) => [
          key,
          restarfall.useValue(store),
        ]),
      ) as Values,
    );
    const restarfallStore = stores.get(store);

    if (restarfallStore) shape.changeValue(restarfallStore, result);

    return null;
  });

  shape.changeValue($stack, [...shape.getValue($stack), restarfallComponent()]);

  return store;
};

test("effect", () => {
  const request = createEffect(() => "qwe-asd");
  const $token = createStore<string>("").on(request.done, (_, v) => v.result);

  console.log("token:", $token.getState() || "empty");
  request();
  console.log("token:", $token.getState() || "empty");
});

test("async effect", async () => {
  const request = createEffect(async () => "qwe-asd");
  const $token = createStore<string>("").on(request.done, (_, v) => v.result);

  await request();
  console.log("token:", $token.getState() || "empty");
});

test("combine", () => {
  const $name = createStore<string>("Bob");
  const $age = createStore<number>(10);
  const $user = combine({ name: $name, age: $age }, (v) => v);

  console.log($user.getState());
});

test("combine after change parent store", () => {
  const changeName = createEvent<string>();
  const changeAge = createEvent<number>();

  const $name = createStore<string>("Bob").on(changeName, (value) => value);
  const $age = createStore<number>(10).on(changeAge, (s, v) => v + s);
  const $user = combine({ name: $name, age: $age }, (v) => v);

  changeName("Alice");
  changeAge(23);

  console.log($user.getState());
});
