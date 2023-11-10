/* eslint-disable no-console */
import { Unit, UnitElement, create, use } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("useValue", () => {
  const $count = create.store<number>(-1);
  const counter = create.unit(() => {
    const count = use.value($count);
    console.log(count);
    return null;
  });
  const shape = create.shape();

  shape.attach(counter());

  // -> -1

  expect(log.mock.calls).toEqual([[-1]]);
});

test("useDispatch by store", () => {
  const $count = create.store<number>(-1);
  const counter = create.unit(() => {
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
  const incCount = create.event<void>();
  const counter = create.unit(() => {
    const setCount = use.dispatch(changeCount);
    const inc = use.dispatch(incCount);
    setCount(2);
    inc();
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
  const counter = create.unit(() => {
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
  const counter = create.unit(() => {
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
  const counter = create.unit(() => {
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
  const counter = create.unit(() => {
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
  const update = create.unit(() => {
    use.promise(request()).then(console.log);
    return null;
  });
  const counter = create.unit(() => {
    use.promise(request()).then(console.log);
    return update();
  });
  const shape = create.shape();

  shape.attach(counter());

  // -> 2
  // -> 2

  await shape.wait();
  expect(log.mock.calls).toEqual([[2], [2]]);
});

test("usePromise [deep]", async () => {
  const request = (value: number) => {
    return new Promise<number>((resolve) =>
      setTimeout(() => resolve(value), 200),
    );
  };

  const $unit = create.store<Unit<[]> | null>(null);

  const update = create.unit(() => {
    use.promise(request(20)).then(console.log);
    use.promise(request(30)).then(console.log);
    request(40).then(console.log);
    return null;
  });

  const launchUpdate = create.unit(() => {
    use.depend($unit);

    const unit = use.value($unit);
    return unit ? unit() : null;
  });

  const counter = create.unit(() => {
    const setUnit = use.dispatch($unit);

    use.promise(request(10)).then((value) => {
      console.log(value);
      setUnit(update);
    });

    return [launchUpdate()];
  });

  const shape = create.shape();

  shape.attach(counter());
  await shape.wait();

  // -> 10
  // -> 20
  // -> 30

  expect(log.mock.calls).toHaveLength(3);
  expect(log.mock.calls).toEqual([[10], [20], [30]]);
});

test("useCache", () => {
  const $count = create.store<number>(0);

  const counter = create.unit(() => {
    const countCache = use.cache<number>("count");
    const countByGet = countCache.get();
    const countByTake = countCache.take(() => 1);

    use.depend($count);

    console.log(use.value($count), countByGet, countByTake, countCache.set(2));

    return null;
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.changeValue($count, 33);

  // -> 0 {} 1 2
  // -> 33 { value: 2 } 2 2

  expect(log.mock.calls).toEqual([
    [0, {}, 1, 2],
    [33, { value: 2 }, 2, 2],
  ]);
});

test("useCache element", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    return null;
  });

  const counter = create.unit(() => {
    const updateElement = use.cache<UnitElement>("element").take(update);

    console.log(updateElement);

    use.depend(change);

    return [updateElement];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);
  shape.callEvent(change);

  expect(log.mock.calls).toHaveLength(3);
  expect(log.mock.calls[0][0].type).toBe("unit-element");
  expect(log.mock.calls[1][0].type).toBe("unit-element");
  expect(log.mock.calls[0][0]).toBe(log.mock.calls[1][0]);
  expect(log.mock.calls[0][0]).toBe(log.mock.calls[2][0]);
});

test("useCache with tail", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    return null;
  });

  const counter = create.unit(() => {
    const elements = {
      first: use.cache<UnitElement>("element", "first").take(update),
      last: use.cache<UnitElement>("element", "last").take(update),
    };

    console.log(elements);

    use.depend(change);

    return [elements.first, elements.last];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  expect(log.mock.calls).toHaveLength(2);
  expect(log.mock.calls[0][0].first.type).toBe("unit-element");
  expect(log.mock.calls[0][0].last.type).toBe("unit-element");
  expect(log.mock.calls[0][0].first).toBe(log.mock.calls[1][0].first);
  expect(log.mock.calls[0][0].last).toBe(log.mock.calls[1][0].last);
});

test("useDetach", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    use.detach(() => console.log("detach"));
    return null;
  });

  const counter = create.unit(() => {
    use.depend(change);
    return [update(), update()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  expect(log.mock.calls).toEqual([["detach"], ["detach"]]);
});

test("useDetach with cache element", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    use.detach(() => console.log("detach"));
    return null;
  });

  const counter = create.unit(() => {
    use.depend(change);

    return [use.cache<UnitElement>("element").take(update), update()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  expect(log.mock.calls).toEqual([["detach"]]);
});

test("useDetach [deep]", () => {
  const change = create.event<void>();

  const setValue = create.unit(() => {
    use.detach(() => console.log("detach"));
    console.log("setValue");
    return null;
  });

  const update = create.unit(() => setValue());

  const counter = create.unit(() => {
    use.depend(change);
    return update();
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  // -> "setValue"
  // -> "setValue"
  // -> "detach"

  expect(log.mock.calls).toEqual([["setValue"], ["setValue"], ["detach"]]);
});

test("useAttach", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    use.attach(() => console.log("attach"));
    return null;
  });

  const counter = create.unit(() => {
    use.depend(change);
    return [update(), update()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  expect(log.mock.calls).toEqual([
    ["attach"],
    ["attach"],
    ["attach"],
    ["attach"],
  ]);
});

test("useAttach with cache element", () => {
  const change = create.event<void>();

  const update = create.unit(() => {
    use.attach(() => console.log("attach"));
    return null;
  });

  const counter = create.unit(() => {
    use.depend(change);

    return [use.cache<UnitElement>("element").take(update), update()];
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  expect(log.mock.calls).toEqual([["attach"], ["attach"], ["attach"]]);
});

test("useAttach [deep]", () => {
  const change = create.event<void>();

  const setValue = create.unit(() => {
    use.attach(() => console.log("attach"));
    console.log("setValue");
    return null;
  });

  const update = create.unit(() => setValue());

  const counter = create.unit(() => {
    use.attach(() => console.log("counter.attach"));
    use.depend(change);
    return update();
  });

  const shape = create.shape();

  shape.attach(counter());
  shape.callEvent(change);

  // -> "setValue"
  // -> "attach"
  // -> "setValue"
  // -> "attach"

  expect(log.mock.calls).toEqual([
    ["setValue"],
    ["counter.attach"],
    ["attach"],
    ["setValue"],
    ["attach"],
  ]);
});
