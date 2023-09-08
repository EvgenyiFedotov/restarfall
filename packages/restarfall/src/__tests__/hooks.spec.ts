/* eslint-disable no-console */
import { create, use } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("useValue", () => {
  const $count = create.store<number>(-1);
  const counter = create.component(() => {
    const count = use.value($count);
    console.log(count);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());

  // -> -1

  expect(log.mock.calls).toEqual([[-1]]);
});

test("useValue with bind depend", () => {
  const $count = create.store<number>(-1);
  const counter = create.component(() => {
    const count = use.value($count, true);
    console.log(count);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.changeValue($count, 2);

  // -> -1

  expect(log.mock.calls).toEqual([[-1], [2]]);
});

test("useDispatch by store", () => {
  const $count = create.store<number>(-1);
  const counter = create.component(() => {
    const setCount = use.dispatch($count);
    setCount(2);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  console.log(shape.getValue($count));

  // -> 2

  expect(log.mock.calls).toEqual([[2]]);
});

test("useDispatch by event", () => {
  const changeCount = create.event<number>();
  const counter = create.component(() => {
    const setCount = use.dispatch(changeCount);
    setCount(2);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  console.log(shape.getEventState(changeCount));

  // -> { payload: 2 }

  expect(log.mock.calls).toEqual([[{ payload: 2 }]]);
});

test("useDepend without filter", () => {
  const changeCount = create.event<number>();
  const counter = create.component(() => {
    const changeCountEvent = use.depend(changeCount);
    console.log(changeCountEvent);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(changeCount, 2);

  // -> { called: false }
  // -> { called: true, payload: 2 }

  expect(log.mock.calls).toEqual([
    [{ called: false }],
    [{ called: true, payload: 2 }],
  ]);
});

test("useDepend with filter", () => {
  const changeCount = create.event<number>();
  const counter = create.component(() => {
    const changeCountEvent = use.depend(
      changeCount,
      (value, { payload }) => value > 2 && payload === 2,
    );
    console.log(changeCountEvent);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(changeCount, 2);
  shape.callEvent(changeCount, 4);
  shape.callEvent(changeCount, 1);

  // -> { called: false }
  // -> { called: true, payload: 4 }

  expect(log.mock.calls).toEqual([
    [{ called: false }],
    [{ called: true, payload: 4 }],
  ]);
});

test("useDepend with lock", () => {
  const changeCount = create.event<number>();
  const counter = create.component(() => {
    const changeCountEvent = use.depend(changeCount, false);
    console.log(changeCountEvent);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(changeCount, 2);

  // -> { called: false }

  expect(log.mock.calls).toEqual([[{ called: false }]]);
});

test("useTake", async () => {
  const $count = create.store<number>(-1);
  const counter = create.component(() => {
    const takeCount = use.take($count);
    setTimeout(() => console.log(takeCount()), 100);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());

  // -> -1

  await new Promise((resolve) => setTimeout(resolve, 200));
  expect(log.mock.calls).toEqual([[-1]]);
});

test("usePromise", async () => {
  const request = () =>
    new Promise<number>((resolve) => setTimeout(() => resolve(2), 200));
  const counter = create.component(() => {
    use.promise(request()).then(console.log);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());

  // -> 2

  await shape.wait();
  expect(log.mock.calls).toEqual([[2]]);
});
