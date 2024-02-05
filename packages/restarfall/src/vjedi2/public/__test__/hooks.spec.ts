import { dispatch as dispatchCore } from "../../core/shape";

import {
  attachElement,
  createShape,
  dispatch,
  getCoreShape,
  wait,
} from "../shape";
import { createEvent, getCoreEvent } from "../event";
import { createUnit } from "../unit";
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
import { createStore, getCoreStore } from "../store";
import { Element } from "../element";

describe("useDepend", () => {
  test("by event", () => {
    const log = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useDepend(event));
      return [];
    });

    attachElement(shape, unit());
    dispatch(shape, event, "/");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "/" } }],
    ]);
  });

  test("by store", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      log(useDepend(store));
      return [];
    });

    attachElement(shape, unit());
    dispatch(shape, store, "/");

    expect(log.mock.calls).toEqual([
      [{ called: false, payload: {} }],
      [{ called: true, payload: { value: "/" } }],
    ]);
  });
});

describe("useValue", () => {
  test("initial value", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      log(useValue(store));
      return [];
    });

    attachElement(shape, unit());

    expect(log.mock.calls).toEqual([["_"]]);
  });

  test("changed value", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      log(useValue(store));
      return [];
    });

    dispatch(shape, store, "/");
    attachElement(shape, unit());

    expect(log.mock.calls).toEqual([["/"]]);
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
    const log = jest.fn();
    const promiseApi = createPromiseApi();
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      const take = useTake(store);
      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return [];
    });

    attachElement(shape, unit());
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["_"]]);
  });

  test("changed value", async () => {
    const log = jest.fn();
    const promiseApi = createPromiseApi();
    const shape = createShape();
    const store = createStore<string>("_");
    const unit = createUnit(() => {
      const take = useTake(store);
      setTimeout(() => {
        log(take());
        promiseApi.resolve();
      }, 100);
      return [];
    });

    dispatch(shape, store, "/");
    attachElement(shape, unit());
    await promiseApi.instance;

    expect(log.mock.calls).toEqual([["/"]]);
  });
});

describe("useDispatch", () => {
  test("by event", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      useDispatch(event)("/");
      return [];
    });

    attachElement(shape, unit());

    expect(getCoreShape(shape).scope.payloads.get(getCoreEvent(event))).toBe(
      "/",
    );
  });

  test("by store", () => {
    const shape = createShape();
    const coreShape = getCoreShape(shape);
    const store = createStore<string>("_");
    const coreStore = getCoreStore(store);
    const unit = createUnit(() => {
      useDispatch(store)("/");
      return [];
    });

    attachElement(shape, unit());

    expect(coreShape.scope.payloads.get(coreStore.changed)).toBe("/");
    expect(coreShape.scope.values.get(coreStore)).toBe("/");
  });
});

describe("usePromise", () => {
  test("1 level", async () => {
    const log = jest.fn();
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
    const log = jest.fn();
    const shape = createShape();
    const child = createUnit(() => {
      log();
      return [];
    });
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
              updateStore(child());
            }, 200);
          }),
        );
      }

      return result;
    });

    attachElement(shape, parent());
    await wait(shape);

    expect(log.mock.calls).toHaveLength(1);
    expect(getCoreShape(shape).scope.values.get(getCoreStore(store))).toEqual({
      type: "element",
    });
  });
});

describe("useScope", () => {
  test("useDepend", () => {
    const log = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const unit = createUnit(() => {
      log(useScope(useDepend, event));
      return [];
    });

    attachElement(shape, unit());
    dispatch(shape, event, "/");
    dispatchCore(
      getCoreShape(shape),
      getCoreShape(shape).tree.struct[0].scope,
      getCoreEvent(event),
      "_",
    );

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
    dispatch(shape, event);

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
    dispatch(shape, event);

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
    dispatch(shape, event);

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
    dispatch(shape, event);

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
    dispatch(shape, event);

    expect(detached.mock.calls).toHaveLength(0);
    expect(called.mock.calls).toHaveLength(2);
  });
});
