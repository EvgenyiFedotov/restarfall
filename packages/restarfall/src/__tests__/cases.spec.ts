/* eslint-disable no-console */
import { create, use } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("example for usage", () => {
  const $count = create.store<number>(0);
  const inc = create.event<void>();
  const dec = create.event<void>();

  const counter = create.component(() => {
    const incEvent = use.depend(inc);
    const decEvent = use.depend(dec);
    const count = use.value($count);
    const setCount = use.dispatch($count);
    if (incEvent.called) setCount(count + 1);
    else if (decEvent.called) setCount(count - 1);
    return null;
  });

  const shape = create.shape();

  shape.listenEvent($count.changed, console.log);
  shape.attach(counter());
  shape.callEvent(inc);
  shape.callEvent(dec);

  // -> 1 {}
  // -> 0 { payload: 1 }

  expect(log.mock.calls).toEqual([
    [1, {}],
    [0, { payload: 1 }],
  ]);
});

test("component with args", () => {
  const counter = create.component((value: number, coef: number) => {
    console.log(value * coef);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter(10, -1));

  // -> -10

  expect(log.mock.calls).toEqual([[-10]]);
});

test("component with children", () => {
  const update = create.component((value: number, coef: number) => {
    console.log(value * coef);
    return null;
  });
  const counter = create.component((single: boolean) =>
    single ? update(10, 1) : [update(20, 0), update(20, -20)],
  );
  const shape = create.shape();

  shape.attach(counter(true));
  shape.attach(counter(false));

  // -> 10
  // -> 0
  // -> -400

  expect(log.mock.calls).toEqual([[10], [0], [-400]]);
});

test("update only chidlren", () => {
  const trigger = create.event<void>();
  const update = create.component((isDepend: boolean, index: number) => {
    if (isDepend) use.depend(trigger);
    console.log("update", index);
    return null;
  });
  const counter = create.component(() => [
    update(true, 0),
    update(false, 1),
    update(true, 2),
  ]);
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(trigger);
  shape.callEvent(trigger);

  // -> "update" 0
  // -> "update" 1
  // -> "update" 2
  // -> "update" 0
  // -> "update" 2
  // -> "update" 0
  // -> "update" 2

  expect(log.mock.calls).toEqual([
    ["update", 0],
    ["update", 1],
    ["update", 2],
    ["update", 0],
    ["update", 2],
    ["update", 0],
    ["update", 2],
  ]);
});

test("strict order call children", () => {
  const reload = create.event<void>();
  const trigger = create.event<void>();
  const setValue = create.component(
    (is: boolean, parentIndex: number, index: number) => {
      use.depend(reload);
      if (is) use.depend(trigger);
      console.log("setValue", parentIndex, index);
      return null;
    },
  );
  const update = create.component((is: boolean, index: number) => {
    if (is) use.depend(trigger);
    console.log("update", index);
    return [
      setValue(false, index, 0),
      setValue(false, index, 1),
      setValue(true, index, 2),
    ];
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(true, 0), update(false, 1), update(true, 2)];
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(trigger);
  shape.callEvent(reload);

  // -> "counter"
  // -> "udpate" 0
  // -> "setValue" 0 0
  // -> "setValue" 0 1
  // -> "setValue" 0 2
  // -> "udpate" 1
  // -> "setValue" 1 0
  // -> "setValue" 1 1
  // -> "setValue" 1 2
  // -> "udpate" 2
  // -> "setValue" 2 0
  // -> "setValue" 2 1
  // -> "setValue" 2 2

  // -> "udpate" 0
  // -> "setValue" 0 0
  // -> "setValue" 0 1
  // -> "setValue" 0 2
  // -> "setValue" 1 2
  // -> "udpate" 2
  // -> "setValue" 2 0
  // -> "setValue" 2 1
  // -> "setValue" 2 2

  // -> "setValue" 2 2
  // -> "setValue" 0 0
  // -> "setValue" 0 1
  // -> "setValue" 0 2
  // -> "setValue" 1 0
  // -> "setValue" 1 1
  // -> "setValue" 1 2
  // -> "setValue" 2 0
  // -> "setValue" 2 1
  // -> "setValue" 2 2

  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update", 0],
    ["setValue", 0, 0],
    ["setValue", 0, 1],
    ["setValue", 0, 2],
    ["update", 1],
    ["setValue", 1, 0],
    ["setValue", 1, 1],
    ["setValue", 1, 2],
    ["update", 2],
    ["setValue", 2, 0],
    ["setValue", 2, 1],
    ["setValue", 2, 2],

    ["update", 0],
    ["setValue", 0, 0],
    ["setValue", 0, 1],
    ["setValue", 0, 2],
    ["setValue", 1, 2],
    ["update", 2],
    ["setValue", 2, 0],
    ["setValue", 2, 1],
    ["setValue", 2, 2],

    ["setValue", 0, 0],
    ["setValue", 0, 1],
    ["setValue", 0, 2],
    ["setValue", 1, 0],
    ["setValue", 1, 1],
    ["setValue", 1, 2],
    ["setValue", 2, 0],
    ["setValue", 2, 1],
    ["setValue", 2, 2],
  ]);
});
