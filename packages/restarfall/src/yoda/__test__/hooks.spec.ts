import {
  useAttach,
  useDepend,
  useDetach,
  useDispatch,
  useEvent,
  usePayload,
  usePromise,
  useScope,
  useStore,
  useTake,
  useValue,
} from "../hooks";
import {
  attachActions,
  attachElement,
  callEvent,
  changeStore,
  createShape,
  getShapeState,
  wait,
} from "../shape";
import { createEvent } from "../event";
import { createUnit } from "../unit";
import { createStore, getStoreState } from "../store";
import { createScope } from "../scope";
import { Element } from "../types";

const log = jest.fn();

beforeEach(() => log.mockReset());

describe("useDepend", () => {
  test("without filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useDepend(event));
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "/");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "/" } }],
    ]);
  });

  test("use store", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      log(useDepend(store));
      return null;
    });

    attachElement(shape, unit());
    changeStore(shape, store, "_");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "_" } }],
    ]);
  });

  test("call event in other scope", () => {
    const shape = createShape();
    const scope = createScope();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useDepend(event));
      return null;
    });

    getShapeState(shape).scope.actions.push({ scope, event, payload: "/" });
    attachElement(shape, unit());
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(log.mock.calls).toEqual([[{ called: false, payload: {} }]]);
  });

  test("with filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(
        useDepend(event, (frame) => {
          log(frame);
          return false;
        }),
      );
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "_");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ value: "_" }],
    ]);
  });

  test("lock filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useDepend(event, false));
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "_");

    expect(log.mock.calls).toEqual([[{ called: false, payload: {} }]]);
  });
});

describe("usePayload", () => {
  test("default", () => {
    const log = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      useDepend(event);
      log(usePayload(event));
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "/");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "/" } }],
    ]);
  });
});

describe("useValue", () => {
  test("initial value", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      log(useValue(store));
      return null;
    });

    attachElement(shape, unit());

    expect(log.mock.calls).toEqual([["/"]]);
  });

  test("value from scope", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      log(useValue(store));
      return null;
    });

    getShapeState(shape).scope.values.set(store, "_");
    attachElement(shape, unit());

    expect(log.mock.calls).toEqual([["_"]]);
  });
});

describe("useTake", () => {
  const createPromiseApi = () => {
    let resolve: () => void = () => undefined;
    const instance = new Promise<void>((_resolve) => {
      resolve = _resolve;
    });

    return { resolve, instance };
  };

  test("initial value", async () => {
    const shape = createShape();
    const promiseApi = createPromiseApi();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      const take = useTake(store);

      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return null;
    });

    attachElement(shape, unit());
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["/"]]);
  });

  test("value from scope", async () => {
    const shape = createShape();
    const promiseApi = createPromiseApi();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      const take = useTake(store);

      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return null;
    });

    getShapeState(shape).scope.values.set(store, "_");
    attachElement(shape, unit());
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["_"]]);
  });
});

describe("useDispatch", () => {
  test("by event", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      useDispatch(event)("/");
      return null;
    });

    attachElement(shape, unit());

    expect(getShapeState(shape).scope.payloads.get(event)).toBe("/");
  });

  test("by store", () => {
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      useDispatch(store)("/");
      return null;
    });

    attachElement(shape, unit());

    expect(
      getShapeState(shape).scope.payloads.get(getStoreState(store).changed),
    ).toBe("/");
    expect(getShapeState(shape).scope.values.get(store)).toBe("/");
  });
});

describe("usePromise", () => {
  test("1 level", async () => {
    const shape = createShape();
    const unit = createUnit(() => {
      usePromise(
        new Promise<void>((resolve) => {
          setTimeout(() => {
            log();
            resolve();
          }, 200);
        }),
      );
      return [];
    });

    attachElement(shape, unit());
    await wait(shape);

    expect(log.mock.calls).toHaveLength(1);
  });

  test("2 level", async () => {
    const shape = createShape();
    const child = createUnit(() => {
      log();
      return [];
    });
    const childElement = child();
    const store = createStore<Element | null>(null);
    const parent = createUnit(() => {
      const updateStore = useDispatch(store);
      const result = useValue(store);

      useDepend(store);

      if (!result) {
        usePromise(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
              updateStore(childElement);
            }, 200);
          }),
        );
      }

      return result;
    });

    attachElement(shape, parent());
    await wait(shape);

    expect(log.mock.calls).toHaveLength(1);
    expect(getShapeState(shape).scope.values.get(store)).toBe(childElement);
  });
});

describe("useScope", () => {
  test("useDepend", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useScope(useDepend, event));
      return [];
    });

    attachElement(shape, unit());
    callEvent(shape, event, "/");
    getShapeState(shape).scope.actions.push({
      scope: getShapeState(shape).tree.struct[0].scope,
      event,
      payload: "_",
    });
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "_" } }],
    ]);
  });
});

describe("useAttach", () => {
  test("1 level", () => {
    const attached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const unit = createUnit(() => {
      useDepend(event);
      useAttach(attached);
      called();
      return [];
    });

    attachElement(shape, unit());
    callEvent(shape, event);

    expect(attached.mock.calls).toHaveLength(1);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("2 level with reattach", () => {
    const attached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createUnit(() => {
      useAttach(attached);
      called();
      return [];
    });
    const parent = createUnit(() => {
      useDepend(event);
      return child();
    });

    attachElement(shape, parent());
    callEvent(shape, event);

    expect(attached.mock.calls).toHaveLength(2);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("2 level with reattach with cache element", () => {
    const attached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createUnit(() => {
      useAttach(attached);
      called();
      return [];
    });
    const childElement = child();
    const parent = createUnit(() => {
      useDepend(event);
      return childElement;
    });

    attachElement(shape, parent());
    callEvent(shape, event);

    expect(attached.mock.calls).toHaveLength(1);
    expect(called.mock.calls).toHaveLength(2);
  });
});

describe("useDetach", () => {
  test("without cached element", () => {
    const detached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createUnit(() => {
      useDetach(detached);
      called();
      return [];
    });
    const parent = createUnit(() => {
      useDepend(event);
      return child();
    });

    attachElement(shape, parent());
    callEvent(shape, event);

    expect(detached.mock.calls).toHaveLength(1);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("with cached element", () => {
    const detached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createUnit(() => {
      useDetach(detached);
      called();
      return [];
    });
    const childElement = child();
    const parent = createUnit(() => {
      useDepend(event);
      return childElement;
    });

    attachElement(shape, parent());
    callEvent(shape, event);

    expect(detached.mock.calls).toHaveLength(0);
    expect(called.mock.calls).toHaveLength(2);
  });
});

describe("useEvent", () => {
  test("default", () => {
    const log = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useEvent(event));
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "/");

    expect(log.mock.calls[0][0][0]).toEqual({ called: false, payload: {} });
    expect(log.mock.calls[0][0][1]).toBeInstanceOf(Function);
    expect(log.mock.calls[1][0][0]).toEqual({
      called: true,
      payload: { value: "/" },
    });
    expect(log.mock.calls[1][0][1]).toBeInstanceOf(Function);
  });

  test("with filter", () => {
    const log = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useEvent(event, ({ value }) => value === "_"));
      return null;
    });

    attachElement(shape, unit());
    callEvent(shape, event, "/");
    callEvent(shape, event, "_");

    expect(log.mock.calls).toHaveLength(2);
  });
});

describe("useStore", () => {
  test("default", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      log(useStore(store));
      return null;
    });

    attachElement(shape, unit());
    changeStore(shape, store, "_");

    expect(log.mock.calls[0][0][0]).toEqual("/");
    expect(log.mock.calls[0][0][1]).toBeInstanceOf(Function);
    expect(log.mock.calls[1][0][0]).toEqual("_");
    expect(log.mock.calls[1][0][1]).toBeInstanceOf(Function);
  });

  test("with filter", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("/");
    const unit = createUnit(() => {
      log(useStore(store, ({ value }) => value === "__"));
      return null;
    });

    attachElement(shape, unit());
    changeStore(shape, store, "_");
    changeStore(shape, store, "__");

    expect(log.mock.calls).toHaveLength(2);
  });
});
