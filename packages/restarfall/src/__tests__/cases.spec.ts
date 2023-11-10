/* eslint-disable no-console */
import { UnitElement, create, use } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

const bodyLog =
  (params: { body?: unknown[]; detach?: unknown[]; attach?: unknown[] }) =>
  () => {
    if (params.body) console.log(...params.body);

    use.detach(() => {
      if (params.detach) console.log(...params.detach);
    });

    use.attach(() => {
      if (params.attach) console.log(...params.attach);
    });

    return null;
  };

test("example for usage", () => {
  const $count = create.store<number>(0);
  const inc = create.event<void>();

  const counter = create.unit(() => {
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

test("unit with args", () => {
  const counter = create.unit((value: number, coef: number) => {
    console.log(value * coef);
    return null;
  });

  const shape = create.shape();

  shape.attach(counter(10, -1));

  // -> -10

  expect(log.mock.calls).toEqual([[-10]]);
});

test("unit with children", () => {
  const setValue = create.unit(() => {
    console.log("setValue");
    return null;
  });
  const update = create.unit(() => {
    console.log("update");
    return setValue();
  });
  const counter = create.unit(() => {
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

  const update = create.unit((index: number) => {
    use.depend(trigger);
    console.log("update", index);
    return null;
  });
  const counter = create.unit(() => {
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

  const counter = create.unit(() => {
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

  const counter = create.unit(() => {
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

test("call event into unit", () => {
  const trigger = create.event<void>();
  const end = create.event<void>();

  const update = create.unit(() => {
    console.log("update");
    use.depend(trigger);
    return null;
  });
  const load = create.unit(() => {
    console.log("load");
    use.depend(end);
    const callTrigger = use.dispatch(trigger);
    callTrigger();
    callTrigger();
    return null;
  });
  const counter = create.unit(() => {
    console.log("counter");
    return [update(), load()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(end);

  // -> "counter"
  // -> "update"
  // -> "load"
  // -> "update"
  // -> "update"
  // -> "load"
  // -> "update"
  // -> "update"

  expect(log.mock.calls).toHaveLength(8);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update"],
    ["load"],
    ["update"],
    ["update"],
    ["load"],
    ["update"],
    ["update"],
  ]);
});

test("change store into unit", () => {
  const $count = create.store<number>(-1);
  const end = create.event<void>();

  const update = create.unit(() => {
    const count = use.value($count);
    use.depend($count);
    console.log("update", count);
    return null;
  });
  const load = create.unit(() => {
    use.depend(end);
    const count = use.value($count);
    const changeCount = use.dispatch($count);
    console.log("load", count);
    changeCount(count + 10);
    return null;
  });
  const counter = create.unit(() => {
    console.log("counter");
    return [update(), load()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(end);

  // -> "counter"
  // -> "update" -1
  // -> "load" -1
  // -> "update" 9
  // -> "load" 9
  // -> "update" 19

  expect(log.mock.calls).toHaveLength(6);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["update", -1],
    ["load", -1],
    ["update", 9],
    ["load", 9],
    ["update", 19],
  ]);
});

test("stable order of calling units and their children", () => {
  const reload = create.event<void>();
  const end = create.event<{ index: number }>();

  const setValue = create.unit(() => {
    console.log("setValue");
    return null;
  });
  const update = create.unit((index: number) => {
    use.depend(reload);
    use.depend(end, (data) => data.index === index);
    console.log("update", index);
    return setValue();
  });
  const counter = create.unit(() => {
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

test("twice attach unit", () => {
  const counter = create.unit((index: number) => {
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

test("use element without cache", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    use.attach(() => console.log("attach"));
    use.detach(() => console.log("detach"));
    return null;
  });

  const updating = update();

  const counter = create.unit(() => {
    use.depend(change);
    return [update(), updating];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  // -> "attach"
  // -> "attach"
  // -> "detach"
  // -> "attach"

  expect(log.mock.calls).toEqual([
    ["attach"],
    ["attach"],
    ["detach"],
    ["attach"],
  ]);
});

test("call event into unit with effects", () => {
  const changeEvent = create.event<void>();
  const updateEvent = create.event<void>();
  const resetEvent = create.event<void>();

  const change = create.unit(() => {
    console.log("change");
    use.depend(changeEvent);
    return null;
  });

  const update = create.unit(() => {
    console.log("update");
    use.depend(updateEvent);
    use.attach(() => console.log("update.attach"));
    use.detach(() => console.log("update.detach"));
    use.dispatch(changeEvent)();
    return null;
  });

  const counter = create.unit(() => {
    console.log("counter");
    use.depend(resetEvent);
    use.dispatch(updateEvent)();
    return [change(), update()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(resetEvent);

  // -> "counter"
  // -> "change"
  // -> "update"
  // -> "update.attach"
  // -> "update"
  // -> "change"
  // -> "change"

  // shape.callEvent(resetEvent);

  // -> "counter"
  // -> "change"
  // -> "update"
  // -> "update.detach"
  // -> "update.attach"
  // -> "update"
  // -> "change"
  // -> "change"

  expect(log.mock.calls).toHaveLength(7 + 8);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["change"],
    ["update"],
    ["update.attach"],
    ["update"],
    ["change"],
    ["change"],
    ["counter"],
    ["change"],
    ["update"],
    ["update.detach"],
    ["update.attach"],
    ["update"],
    ["change"],
    ["change"],
  ]);
});

test("change store into unit [more simple case]", () => {
  const $count = create.store<number>(0);

  const updated = create.unit(() => {
    console.log("updated", use.value($count));
    use.depend($count);
    return null;
  });

  const change = create.unit(() => {
    console.log("change");
    use.dispatch($count)(2);
    return null;
  });

  const counter = create.unit(() => {
    console.log("counter");
    return [updated(), change()];
  });

  const shape = create.shape();

  shape.attach(counter());

  // -> "counter"
  // -> "updated" 0
  // -> "change"
  // -> "updated" 2

  expect(log.mock.calls).toHaveLength(4);
  expect(log.mock.calls).toEqual([
    ["counter"],
    ["updated", 0],
    ["change"],
    ["updated", 2],
  ]);
});

test("detach / attach with few null-child", () => {
  const update = create.event<void>();

  const toggler = create.unit(
    // eslint-disable-next-line sonarjs/no-duplicate-string
    bodyLog({ detach: ["toggler.detach"], attach: ["toggler.attach"] }),
  );
  const signin = create.unit(
    // eslint-disable-next-line sonarjs/no-duplicate-string
    bodyLog({ detach: ["signin.detach"], attach: ["signin.attach"] }),
  );
  const signup = create.unit(
    // eslint-disable-next-line sonarjs/no-duplicate-string
    bodyLog({ detach: ["signup.detach"], attach: ["signup.attach"] }),
  );

  const launch = create.unit(() => {
    const { called } = use.depend(update);
    const tglr = use.cache<UnitElement>("tglr").take(toggler);

    if (called) return [null, tglr, signin(), signup()];

    return [null, tglr, null];
  });

  const shape = create.shape();

  shape.attach(launch());
  shape.callEvent(update);
  shape.callEvent(update);

  // -> "toggler.attach"
  // -> "signin.attach"
  // -> "signup.attach"
  // -> "signin.detach"
  // -> "signup.detach"
  // -> "signin.attach"
  // -> "signup.attach"

  expect(log.mock.calls).toHaveLength(7);
  expect(log.mock.calls).toEqual([
    ["toggler.attach"],

    ["signin.attach"],
    ["signup.attach"],

    ["signin.detach"],
    ["signup.detach"],
    ["signin.attach"],
    ["signup.attach"],
  ]);
});

test("detach / attach with move child between children", () => {
  const update = create.event<void>();

  const toggler = create.unit(
    bodyLog({ detach: ["toggler.detach"], attach: ["toggler.attach"] }),
  );
  const signin = create.unit(
    bodyLog({ detach: ["signin.detach"], attach: ["signin.attach"] }),
  );
  const signup = create.unit(
    bodyLog({ detach: ["signup.detach"], attach: ["signup.attach"] }),
  );

  const launch = create.unit(() => {
    const { called } = use.depend(update);
    const tglr = use.cache<UnitElement>().take(toggler);

    if (called) return [null, signin(), signup(), tglr];

    return [null, tglr, null];
  });

  const shape = create.shape();

  shape.attach(launch());
  shape.callEvent(update);
  shape.callEvent(update);

  // -> "toggler.attach"
  // -> "signin.attach"
  // -> "signup.attach"
  // -> "signin.detach"
  // -> "signup.detach"
  // -> "signin.attach"
  // -> "signup.attach"

  expect(log.mock.calls).toHaveLength(7);
  expect(log.mock.calls).toEqual([
    ["toggler.attach"],

    ["signin.attach"],
    ["signup.attach"],

    ["signin.detach"],
    ["signup.detach"],
    ["signin.attach"],
    ["signup.attach"],
  ]);
});

test("detach / attach with the same element", () => {
  const update = create.event<boolean>();

  const toggler = create.unit(
    bodyLog({
      // eslint-disable-next-line sonarjs/no-duplicate-string
      body: ["toggler.body"],
      detach: ["toggler.detach"],
      attach: ["toggler.attach"],
    }),
  );

  const launch = create.unit(() => {
    const { payload } = use.depend(update);
    const cache = use.cache<UnitElement>("element");

    let element = cache.take(() => toggler());

    if (payload) {
      element = toggler();
      cache.set(element);
    }

    return [element, element];
  });

  const shape = create.shape();

  shape.attach(launch());
  shape.callEvent(update, false);
  shape.callEvent(update, true);

  // -> "toggler.body"
  // -> "toggler.attach"

  // -> "toggler.body"

  // -> "toggler.body"
  // -> "toggler.detach"
  // -> "toggler.attach"

  expect(log.mock.calls).toHaveLength(6);
  expect(log.mock.calls).toEqual([
    ["toggler.body"],
    ["toggler.attach"],

    ["toggler.body"],

    ["toggler.body"],
    ["toggler.detach"],
    ["toggler.attach"],
  ]);
});

test("detach / attach with cache few elements", () => {
  const update = create.event();

  const toggler = create.unit(
    bodyLog({
      // eslint-disable-next-line sonarjs/no-duplicate-string
      body: ["toggler.body"],
      detach: ["toggler.detach"],
      attach: ["toggler.attach"],
    }),
  );

  const launch = create.unit(() => {
    use.depend(update);

    return use.cache<UnitElement[]>().take(() => [toggler(), toggler()]);
  });

  const shape = create.shape();

  shape.attach(launch());
  shape.callEvent(update, true);

  // -> "toggler.body"
  // -> "toggler.body"
  // -> "toggler.attach"
  // -> "toggler.attach"

  // -> "toggler.body"
  // -> "toggler.body"

  expect(log.mock.calls).toHaveLength(6);
  expect(log.mock.calls).toEqual([
    ["toggler.body"],
    ["toggler.body"],
    ["toggler.attach"],
    ["toggler.attach"],

    ["toggler.body"],
    ["toggler.body"],
  ]);
});
