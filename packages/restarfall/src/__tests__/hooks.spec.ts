import { createComponent } from "../component";
import { createEvent } from "../event";
import {
  useDepend,
  useDispatch,
  usePromise,
  useTake,
  useValue,
} from "../hooks";
import { createShape } from "../shape";
import { createStore } from "../store";

describe("useDepend", () => {
  test("outside component", () => {
    expect(() => useDepend(createEvent())).toThrow();
  });

  test("event", () => {
    const send = createEvent();
    const body = jest.fn(() => {
      useDepend(send);
      return null;
    });
    const component = createComponent(body);
    const shape = createShape();

    shape.attach(component());
    shape.callEvent(send, undefined);

    expect(body.mock.calls).toHaveLength(2);
  });

  test("store", () => {
    const $store = createStore<string>("");
    const body = jest.fn(() => {
      useDepend($store);
      return [];
    });
    const component = createComponent(body);
    const shape = createShape();

    shape.attach(component());
    shape.callEvent($store.changed, "test");

    expect(body.mock.calls).toHaveLength(2);
  });

  test("use filter", () => {
    const $store = createStore<string>("");
    const body = jest.fn(() => {
      useDepend(
        $store,
        (value, { payload }) => payload === "test" && value === "run",
      );
      return [];
    });
    const component = createComponent(body);
    const shape = createShape();

    shape.attach(component());
    shape.callEvent($store.changed, "test");
    shape.callEvent($store.changed, "run");

    expect(body.mock.calls).toHaveLength(2);
  });

  test("eventState", () => {
    const $store = createStore<string>("");
    const event = createEvent<string>();
    const check = jest.fn();
    const body = jest.fn(() => {
      check(useDepend($store));
      check(useDepend(event));
      return [];
    });
    const component = createComponent(body);
    const shape = createShape();

    shape.attach(component());
    shape.callEvent($store.changed, "test");
    shape.callEvent(event, "run");

    expect(body.mock.calls).toHaveLength(3);
    expect(check.mock.calls[0][0]).toEqual({ called: false });
    expect(check.mock.calls[1][0]).toEqual({ called: false });
    expect(check.mock.calls[2][0]).toEqual({ called: true, payload: "test" });
    expect(check.mock.calls[3][0]).toEqual({ called: false });
    expect(check.mock.calls[4][0]).toEqual({ called: false, payload: "test" });
    expect(check.mock.calls[5][0]).toEqual({ called: true, payload: "run" });
  });
});

describe("useDispatch", () => {
  test("outside component", () => {
    expect(() => useDispatch(createEvent())).toThrow();
  });

  test("event", () => {
    const event = createEvent<string>();
    const component = createComponent(() => {
      const callEvent = useDispatch(event);
      callEvent("test");
      callEvent("test");
      return null;
    });
    const shape = createShape();
    const listener = jest.fn();

    shape.listenEvent(event, listener);
    shape.attach(component());

    expect(listener.mock.calls).toHaveLength(2);
  });

  test("store", () => {
    const $store = createStore<string>("");
    const component = createComponent(() => {
      const callEvent = useDispatch($store);
      callEvent("test");
      callEvent("test");
      return null;
    });
    const shape = createShape();
    const listener = jest.fn();

    shape.listenEvent($store.changed, listener);
    shape.attach(component());

    expect(listener.mock.calls).toHaveLength(1);
    expect(shape.getValue($store)).toBe("test");
  });
});

describe("useValue", () => {
  test("outside component", () => {
    expect(() => useValue(createStore(""))).toThrow();
  });

  test("default", () => {
    const $store = createStore<string>("def");
    const check = jest.fn();
    const component = createComponent(() => {
      check(useValue($store));
      return null;
    });
    const shape = createShape();

    shape.attach(component());

    expect(check.mock.calls[0][0]).toBe("def");
  });

  test("use depend", () => {
    const $store = createStore<string>("def");
    const check = jest.fn();
    const component = createComponent(() => {
      check(useValue($store, true));
      return null;
    });
    const shape = createShape();

    shape.attach(component());
    shape.setValue($store, "test");
    shape.callEvent($store.changed, "event-value");

    expect(check.mock.calls[0][0]).toBe("def");
    expect(check.mock.calls[1][0]).toBe("test");
  });
});

describe("useTake", () => {
  test("outside component", () => {
    expect(() => useTake(createStore(""))).toThrow();
  });

  test("default", () => {
    const $store = createStore<string>("def");
    const check = jest.fn();
    const component = createComponent(() => {
      check(useTake($store)());
      return null;
    });
    const shape = createShape();

    shape.attach(component());
    expect(check.mock.calls[0][0]).toBe("def");
  });
});

describe("usePromise", () => {
  test("outside component", () => {
    expect(() =>
      usePromise(new Promise<void>((resolve) => resolve())),
    ).toThrow();
  });

  test("default", async () => {
    const request = () => {
      return new Promise<void>((resolve) => setTimeout(resolve, 100));
    };
    const handler = jest.fn();
    const component = createComponent(() => {
      usePromise(request()).then(handler);
      return null;
    });
    const shape = createShape();

    await shape.attach(component()).wait();

    expect(handler.mock.calls).toHaveLength(1);
  });
});
