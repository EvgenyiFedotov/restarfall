/* eslint-disable no-console */
import { create, use } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("example for usage", () => {
  const $count = create.store<number>(0);
  const inc = create.event<void>();

  const counter = create.component(() => {
    const incEvent = use.depend(inc);
    const count = use.value($count);
    const setCount = use.dispatch($count);

    if (incEvent.called) setCount(count + 1);

    return null;
  });

  const shape = create.shape();

  shape.listenEvent($count.changed, console.log);
  shape.attach(counter());
  shape.callEvent(inc);
  shape.callEvent(inc);

  // -> 1 {}
  // -> 2 { payload: 1 }

  expect(log.mock.calls).toEqual([
    [1, {}],
    [2, { payload: 1 }],
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
  const setValue = create.component(() => {
    console.log("setValue");
    return null;
  });
  const update = create.component(() => {
    console.log("update");
    return setValue();
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(), update()];
  });

  const shape = create.shape();

  shape.attach(counter());

  // -> "counter"
  // -> "update"
  // -> "setValue"
  // -> "update"
  // -> "setValue"

  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update"],
    ["setValue"],
    ["update"],
    ["setValue"],
  ]);
});

test("update only chidlren", () => {
  const trigger = create.event<void>();

  const update = create.component((index: number) => {
    use.depend(trigger);
    console.log("update", index);
    return null;
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(0), update(1)];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(trigger);

  // -> "counter"
  // -> "update" 0
  // -> "update" 1
  // -> "update" 0
  // -> "update" 1

  expect(log.mock.calls).toHaveLength(5);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update", 0],
    ["update", 1],
    ["update", 0],
    ["update", 1],
  ]);
});

test("payload of event by depend", () => {
  const trigger = create.event<number>();

  const counter = create.component(() => {
    const event = use.depend(trigger);
    console.log("counter", event);
    return null;
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(trigger, 1);

  // -> "counter" { called: false }
  // -> "counter" { called: true, payload: 1 }

  expect(log.mock.calls).toEqual([
    ["counter", { called: false }],
    ["counter", { called: true, payload: 1 }],
  ]);
});

test("filter update by depend", () => {
  const trigger = create.event<number>();

  const counter = create.component(() => {
    const event = use.depend(trigger, (value) => value > 2);
    console.log("counter", event.payload ?? -1);
    return null;
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(trigger, 0);
  shape.callEvent(trigger, 3);

  // -> "counter" -1
  // -> "counter" 3

  expect(log.mock.calls).toEqual([
    ["counter", -1],
    ["counter", 3],
  ]);
});

test("call event into component", () => {
  const trigger = create.event<void>();
  const end = create.event<void>();

  const update = create.component(() => {
    console.log("update");
    use.depend(trigger);
    return null;
  });
  const load = create.component(() => {
    console.log("load");
    use.depend(end);
    const callTrigger = use.dispatch(trigger);
    callTrigger();
    return null;
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(), load()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(end);

  // -> "counter"
  // -> "update"
  // -> "load"
  // -> "load"
  // -> "update"

  expect(log.mock.calls).toHaveLength(5);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update"],
    ["load"],
    ["load"],
    ["update"],
  ]);
});

test("change store into component", () => {
  const $count = create.store<number>(-1);
  const end = create.event<void>();

  const update = create.component(() => {
    const count = use.value($count);
    use.depend($count);
    console.log("update", count);
    return null;
  });
  const load = create.component(() => {
    use.depend(end);
    const count = use.value($count);
    const changeCount = use.dispatch($count);
    console.log("load", count);
    changeCount(count + 10);
    return null;
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(), load()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(end);

  // -> "counter"
  // -> "update" -1
  // -> "load" -1
  // -> "load" 9
  // -> "update" 19

  expect(log.mock.calls).toHaveLength(5);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update", -1],
    ["load", -1],
    ["load", 9],
    ["update", 19],
  ]);
});

test("stable order of calling components and their children", () => {
  const reload = create.event<void>();
  const end = create.event<{ index: number }>();

  const setValue = create.component(() => {
    console.log("setValue");
    return null;
  });
  const update = create.component((index: number) => {
    use.depend(reload);
    use.depend(end, (data) => data.index === index);
    console.log("update", index);
    return setValue();
  });
  const counter = create.component(() => {
    console.log("counter");
    return [update(0), update(1)];
  });
  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(end, { index: 1 });
  shape.callEvent(reload);

  // -> "counter"
  // -> "update" 0
  // -> "setValue"
  // -> "update" 1
  // -> "setValue"
  // -> "update" 1
  // -> "setValue"
  // -> "update" 0
  // -> "setValue"
  // -> "update" 1
  // -> "setValue"

  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update", 0],
    ["setValue"],
    ["update", 1],
    ["setValue"],
    ["update", 1],
    ["setValue"],
    ["update", 0],
    ["setValue"],
    ["update", 1],
    ["setValue"],
  ]);
});

test("twice attach component", () => {
  const counter = create.component((index: number) => {
    console.log("counter", index);
    return null;
  });

  const shape = create.shape();

  shape.attach(counter(0));
  shape.attach(counter(1));

  // -> "counter" 0
  // -> "counter" 1

  expect(log.mock.calls).toEqual([
    ["counter", 0],
    ["counter", 1],
  ]);
});
