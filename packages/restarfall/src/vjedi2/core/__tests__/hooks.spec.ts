import { Element, createElement } from "../element";
import { createEvent } from "../event";
import {
  useAttach,
  useDepend,
  useDetach,
  useDispatch,
  usePromise,
  useScope,
  useTake,
  useValue,
} from "../hooks";
import { createStore } from "../store";
import { createScope, wait } from "../scope";
import { attachElement, createShape, dispatch } from "../shape";

const log = jest.fn();

beforeEach(() => log.mockReset());

describe("useDepend", () => {
  test("without filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      log(useDepend(event));
      return null;
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event, "/");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "/" } }],
    ]);
  });

  test("use store", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const element = createElement(() => {
      log(useDepend(store));
      return null;
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, store, "_");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "_" } }],
    ]);
  });

  test("call event in other scope", () => {
    const shape = createShape();
    const scope = createScope();
    const store = createStore<string>("/");
    const element = createElement(() => {
      log(useDepend(store));
      return null;
    }, []);

    attachElement(shape, element);
    dispatch(shape, scope, store, "_");

    expect(log.mock.calls).toEqual([[{ called: false, payload: {} }]]);
  });

  test("with filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      log(
        useDepend(event, (frame) => {
          log(frame);
          return false;
        }),
      );
      return null;
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event, "_");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ value: "_" }],
    ]);
  });

  test("lock filter", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      log(useDepend(event, false));
      return null;
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event, "_");

    expect(log.mock.calls).toEqual([[{ called: false, payload: {} }]]);
  });
});

describe("useValue", () => {
  test("initial value", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const element = createElement(() => {
      log(useValue(store));
      return null;
    }, []);

    attachElement(shape, element);

    expect(log.mock.calls).toEqual([["/"]]);
  });

  test("value from scope", () => {
    const shape = createShape();
    const store = createStore<string>("/");
    const element = createElement(() => {
      log(useValue(store));
      return null;
    }, []);

    shape.scope.values.set(store, "_");
    attachElement(shape, element);

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
    const element = createElement(() => {
      const take = useTake(store);

      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return null;
    }, []);

    attachElement(shape, element);
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["/"]]);
  });

  test("value from scope", async () => {
    const shape = createShape();
    const promiseApi = createPromiseApi();
    const store = createStore<string>("/");
    const element = createElement(() => {
      const take = useTake(store);

      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return null;
    }, []);

    shape.scope.values.set(store, "_");
    attachElement(shape, element);
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["_"]]);
  });
});

describe("useDispatch", () => {
  test("by event", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      useDispatch(event)("/");
      return null;
    }, []);

    attachElement(shape, element);

    expect(shape.scope.payloads.get(event)).toBe("/");
  });

  test("by store", () => {
    const shape = createShape();
    const store = createStore<string>("_");
    const element = createElement(() => {
      useDispatch(store)("/");
      return null;
    }, []);

    attachElement(shape, element);

    expect(shape.scope.payloads.get(store.changed)).toBe("/");
    expect(shape.scope.values.get(store)).toBe("/");
  });
});

describe("usePromise", () => {
  test("1 level", async () => {
    const shape = createShape();
    const element = createElement(() => {
      usePromise(
        new Promise<void>((resolve) => {
          setTimeout(() => {
            log();
            resolve();
          }, 200);
        }),
      );
      return [];
    }, []);

    attachElement(shape, element);
    await wait(shape.scope);

    expect(log.mock.calls).toHaveLength(1);
  });

  test("2 level", async () => {
    const shape = createShape();
    const child = createElement(() => {
      log();
      return [];
    }, []);
    const store = createStore<Element | null>(null);
    const parent = createElement(() => {
      const updateStore = useDispatch(store);
      const result = useValue(store);

      useDepend(store);

      if (!result) {
        usePromise(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              resolve();
              updateStore(child);
            }, 200);
          }),
        );
      }

      return result;
    }, []);

    attachElement(shape, parent);
    await wait(shape.scope);

    expect(log.mock.calls).toHaveLength(1);
    expect(shape.scope.values.get(store)).toBe(child);
  });
});

describe("useScope", () => {
  test("useDepend", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      log(useScope(useDepend, event));
      return [];
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event, "/");
    dispatch(shape, shape.tree.struct[0].scope, event, "_");

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
    const element = createElement(() => {
      useDepend(event);
      useAttach(attached);
      called();
      return [];
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event);

    expect(attached.mock.calls).toHaveLength(1);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("2 level with reattach", () => {
    const attached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const parent = createElement(() => {
      useDepend(event);
      return createElement(() => {
        useAttach(attached);
        called();
        return [];
      }, []);
    }, []);

    attachElement(shape, parent);
    dispatch(shape, shape.scope, event);

    expect(attached.mock.calls).toHaveLength(2);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("2 level with reattach with cache element", () => {
    const attached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createElement(() => {
      useAttach(attached);
      called();
      return [];
    }, []);
    const parent = createElement(() => {
      useDepend(event);
      return child;
    }, []);

    attachElement(shape, parent);
    dispatch(shape, shape.scope, event);

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
    const element = createElement(() => {
      useDepend(event);
      return createElement(() => {
        useDetach(detached);
        called();
        return [];
      }, []);
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event);

    expect(detached.mock.calls).toHaveLength(1);
    expect(called.mock.calls).toHaveLength(2);
  });

  test("with cached element", () => {
    const detached = jest.fn();
    const called = jest.fn();
    const shape = createShape();
    const event = createEvent<void>();
    const child = createElement(() => {
      useDetach(detached);
      called();
      return [];
    }, []);
    const element = createElement(() => {
      useDepend(event);
      return child;
    }, []);

    attachElement(shape, element);
    dispatch(shape, shape.scope, event);

    expect(detached.mock.calls).toHaveLength(0);
    expect(called.mock.calls).toHaveLength(2);
  });
});
