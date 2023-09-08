/* eslint-disable no-console */
import {
  create,
  use,
  createShape,
  createStore,
  createEvent,
  createComponent,
  useValue,
  useTake,
  useDepend,
  useDispatch,
  usePromise,
  Event,
} from "../index";

const log = jest.fn();

global.console = { ...console, log };

beforeEach(() => log.mockClear());

test("usage", () => {
  const $count = create.store(0);
  const inc = create.event();
  const dec = create.event();

  const counter = create.component(() => {
    const count = use.value($count);
    const setCount = use.dispatch($count);

    const incEvent = use.depend(inc);
    const decEvent = use.depend(dec);

    if (incEvent.called) setCount(count + 1);
    else if (decEvent.called) setCount(count - 1);

    return null;
  });

  const shape = create.shape();

  shape.listenEvent($count.changed, console.log);
  shape.attach(counter());
  shape.callEvent(inc, undefined);
  shape.callEvent(dec, undefined);

  expect(log.mock.calls).toEqual([
    [1, {}],
    [0, { payload: 1 }],
  ]);
});

test("Use better variant then into usage example", () => {
  const $count = create.store(0);
  const inc = create.event();
  const dec = create.event();

  const updateCount = create.component(
    (event: Event<unknown>, coef: number) => {
      const count = use.value($count);
      const setCount = use.dispatch($count);
      const updateEvent = use.depend(event);
      if (updateEvent.called) setCount(count + coef);
      return null;
    },
  );

  const counter = create.component(() => [
    updateCount(inc, 1),
    updateCount(dec, 2),
  ]);

  const shape = create.shape();
  shape.attach(counter());
});

test("Change value into shape", () => {
  const shape = createShape();
  const $count = createStore<number>(-1);

  console.log(shape.hasValue($count)); // -> false
  console.log(shape.getValue($count)); // -> -1
  console.log(shape.setValue($count, 100)); // -> Shape
  console.log(shape.getValue($count)); // -> 100
  console.log(shape.hasValue($count)); // -> true
  console.log(shape.changeValue($count, 200)); // -> Shape
  console.log(shape.getValue($count)); // -> 200

  expect(log.mock.calls).toEqual([
    [false],
    [-1],
    [shape],
    [100],
    [true],
    [shape],
    [200],
  ]);
});

test("Use deserialize / serialize shape", () => {
  const shape = createShape();
  const $count = createStore<number>(-1);
  const counter = createComponent(() => null, {
    deserialize: (getValue) => ({
      count: {
        store: $count,
        value:
          typeof getValue("count").value === "number"
            ? getValue("count").value
            : $count.initialValue,
      },
    }),
    serialize: (getValue) => ({
      count: getValue($count),
    }),
  });

  shape.setRawData({ count: 100 });
  shape.attach(counter());

  console.log(shape.getValue($count)); // -> 100

  shape.changeValue($count, 200);

  console.log(shape.serialize()); // -> { count: 200 }

  expect(log.mock.calls).toEqual([[100], [{ count: 200 }]]);
});

test.todo("Use deep deserialize / serialize shape");

test("Call event into shape", () => {
  const changeCount = createEvent<number>();
  const shape = createShape();

  console.log(shape.getEventState(changeCount)); // {} (because event doesn't call)
  shape.listenEvent(changeCount, console.log); // -> fn (unlitener)
  shape.unlistenEvent(changeCount, console.log);

  shape.callEvent(changeCount, 100); // -x (because was call method `shape.unlistenEvent`)
  shape.listenEvent(changeCount, console.log);
  shape.callEvent(changeCount, 200); // -> 200, { payload: 100 }
  console.log(shape.getEventState(changeCount)); // { payload: 200 }

  expect(log.mock.calls).toEqual([
    [{}],
    [200, { payload: 100 }],
    [{ payload: 200 }],
  ]);
});

const request = () => {
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve("token"), 1000);
  });
};

test("Use `usePromise` hook and `wait` after attach component", async () => {
  const counter = createComponent(() => {
    usePromise(request()).then((token) => console.log(token));
    return null;
  });
  const shape = createShape();

  await shape.attach(counter()).wait();
  console.log("done");

  // -> "token"
  // -> "done"

  expect(log.mock.calls).toEqual([["token"], ["done"]]);
});

test("Use `parentShape` for shape", () => {
  const $count = createStore<number>(-100);
  const parentShape = createShape().setValue($count, 200);
  const shape = createShape(parentShape);

  console.log(parentShape.getValue($count)); // -> 200
  console.log(shape.getValue($count)); // -> 200

  shape.changeValue($count, 0);

  console.log(parentShape.getValue($count)); // -> 200
  console.log(shape.getValue($count)); // -> 0

  expect(log.mock.calls).toEqual([[200], [200], [200], [0]]);
});

test("Use `arguments` and `сhildren` for component", () => {
  const $count = create.store(0);
  const inc = create.event<number>();
  const dec = create.event<void>();

  const setValue = createComponent((value: number, coef: number) => {
    const setCount = useDispatch($count);
    setCount(value + coef);
    return null;
  });
  const update = createComponent((coef: number) => {
    const count = useValue($count);
    return [setValue(count, coef), setValue(count, 100)];
  });
  const counter = createComponent(() => {
    const incEvent = useDepend(inc);
    const decEvent = useDepend(dec);
    if (incEvent.called) return update(1);
    if (decEvent.called) return update(-1);
    return null;
  });

  const shape = createShape();

  shape.listenEvent($count.changed, console.log);
  shape.attach(counter());
  shape.callEvent(inc, 2);
  shape.callEvent(dec);
  console.log(shape.getValue($count)); // 200

  expect(log.mock.calls).toEqual([
    [1, {}],
    [100, { payload: 1 }],
    [99, { payload: 100 }],
    [200, { payload: 99 }],
    [200],
  ]);
});

test.todo("Use `useTake` hook");

test.todo("Use `useValue` hook");

test.todo("Use `useDepend` hook");

test.todo("Use `useDispatch` hook");
