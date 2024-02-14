import {
  attachActions,
  attachElement,
  callEvent,
  changeStore,
  createShape,
  getScopeShape,
  getShapeState,
  isShape,
  wait,
  serialize,
  setRawData,
  listen,
} from "../shape";
import { createScope, getPayload, getValue } from "../scope";
import {
  attachNode,
  createNode,
  createTree,
  getCurrentNodeStrict,
} from "../tree";
import { createEvent } from "../event";
import { getContext, root } from "../root";
import { createUnit } from "../unit";
import { createStore, getStoreState } from "../store";

beforeEach(() => {
  root.stack = [];
});

describe("createShape", () => {
  test("instance", () => {
    expect(createShape()).toEqual({ type: "shape" });
  });
});

describe("isShape", () => {
  test("correct", () => {
    expect(isShape(createShape())).toBe(true);
  });

  test("incorrect", () => {
    expect(isShape({ type: "shape" })).toBe(false);
  });
});

describe("getShapeState", () => {
  test("correct", () => {
    expect(getShapeState(createShape())).toEqual({
      tree: createTree(),
      scope: createScope(),
    });
  });

  test("incorrect", () => {
    expect(() => getShapeState({ type: "shape" })).toThrow(
      new Error("Shape is incorrect"),
    );
  });
});

describe("getScopeShape", () => {
  test("correct", () => {
    const shape = createShape();

    expect(getScopeShape(getShapeState(shape).scope)).toBe(shape);
  });

  test("incorrect", () => {
    expect(() => getScopeShape(createScope())).toThrow(
      new Error("Scope is incorrect"),
    );
  });
});

describe("attachAction", () => {
  test("by event", () => {
    const log = jest.fn();
    const attached = jest.fn();
    const detached = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const child = createUnit(() => {
      const { tree } = getShapeState(shape);
      const node = getCurrentNodeStrict(tree);

      node.effects.attached.add(attached);
      node.effects.detached.add(detached);

      return null;
    });
    const parent = createUnit(() => {
      const { scope, tree } = getShapeState(shape);
      const { currentEvent } = scope;
      const context = getContext();
      const node = getCurrentNodeStrict(tree);

      node.depends.push({ event, filter: null });
      log({ scope, tree, currentEvent, context });

      return child();
    });
    const { scope, tree } = getShapeState(shape);

    attachNode(tree, createNode(parent()));
    getShapeState(shape).scope.actions.push({
      scope,
      event,
      payload: "/",
    });
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(log.mock.calls[0][0].tree).toBe(tree);
    expect(log.mock.calls[1][0].tree).not.toBe(tree);
    expect(log.mock.calls[0][0].scope).toBe(scope);
    expect(log.mock.calls[1][0].scope).toBe(scope);
    expect(log.mock.calls[0][0].currentEvent).toBe(null);
    expect(log.mock.calls[1][0].context.scope).toBe(scope);

    expect(attached.mock.calls).toHaveLength(1);
    expect(detached.mock.calls).toHaveLength(1);

    expect(getPayload(scope, event).value).toBe("/");
  });

  test("with store", () => {
    const log = jest.fn();
    const shape = createShape();
    const store = createStore<string>("");
    const storeState = getStoreState(store);
    const unit = createUnit(() => {
      const { tree } = getShapeState(shape);
      const node = getCurrentNodeStrict(tree);

      node.depends.push({ event: storeState.changed, filter: null });
      log();

      return null;
    });

    attachNode(getShapeState(shape).tree, createNode(unit()));
    getShapeState(shape).scope.actions.push(
      {
        scope: getShapeState(shape).scope,
        event: getStoreState(store).changed,
        payload: "/",
        store,
      },
      {
        scope: getShapeState(shape).scope,
        event: getStoreState(store).changed,
        payload: "/",
        store,
      },
    );
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(getValue(getShapeState(shape).scope, store).value).toBe("/");
    expect(log.mock.calls).toHaveLength(2);
  });
});

describe("attachActions", () => {
  test("stack empty", () => {
    const shape = createShape();
    const { scope } = getShapeState(shape);
    const event = createEvent<string>();

    scope.actions.push({ scope, event, payload: "/" });
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(scope.actions).toHaveLength(0);
  });

  test("stack not empty", () => {
    const shape = createShape();
    const { scope, tree } = getShapeState(shape);
    const event = createEvent<string>();

    root.stack.push({ scope, tree });
    scope.actions.push({ scope, event, payload: "/" });
    attachActions(shape, getShapeState(shape).scope, getShapeState(shape).tree);

    expect(scope.actions).toHaveLength(1);
  });
});

describe("attachElement", () => {
  test("default", () => {
    const attached = jest.fn();
    const shape = createShape();
    const unit = createUnit(() => {
      const { tree } = getShapeState(shape);
      const node = getCurrentNodeStrict(tree);

      node.effects.attached.add(attached);

      return null;
    });

    attachElement(shape, unit());

    expect(attached.mock.calls).toHaveLength(1);
  });
});

describe("callEvent", () => {
  test("default", () => {
    const shape = createShape();
    const event = createEvent<string>();

    callEvent(shape, event, "/");

    expect(getShapeState(shape).scope.actions).toHaveLength(0);
  });
});

describe("changeStore", () => {
  test("default", () => {
    const shape = createShape();
    const store = createStore<string>("");

    changeStore(shape, store, "/");

    expect(getShapeState(shape).scope.actions).toHaveLength(0);
  });

  test("force", () => {
    const shape = createShape();
    const store = createStore<string>("");

    changeStore(shape, store, "/", true);

    expect(getShapeState(shape).scope.actions).toHaveLength(0);
  });
});

describe("wait", () => {
  test("1 level promises", async () => {
    const log = jest.fn();
    const shape = createShape();
    const promise = new Promise<void>((resolve) => {
      log("promise");
      resolve();
    });

    getShapeState(shape).scope.promises.add(promise);
    await wait(shape);

    expect(getShapeState(shape).scope.promises.size).toBe(0);
    expect(log.mock.calls).toHaveLength(1);
  });

  test("2 level promises", async () => {
    const log = jest.fn();
    const shape = createShape();
    const promise = new Promise<void>((resolve) => {
      log("promise");
      resolve();
      getShapeState(shape).scope.promises.add(
        new Promise<void>((resolve) => {
          log("promise");
          resolve();
        }),
      );
    });

    getShapeState(shape).scope.promises.add(promise);
    await wait(shape);

    expect(getShapeState(shape).scope.promises.size).toBe(0);
    expect(log.mock.calls).toHaveLength(2);
  });
});

describe("listen", () => {
  test("default", () => {
    expect(listen(createShape(), createEvent(), jest.fn())).toBeInstanceOf(
      Function,
    );
  });

  test("call event", () => {
    const listener = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();

    listen(shape, event, listener);
    callEvent(shape, event, "/");

    expect(listener.mock.calls).toEqual([["/"]]);
  });

  test("call event after unlisten", () => {
    const listener = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();

    listen(shape, event, listener)();
    callEvent(shape, event, "/");

    expect(listener.mock.calls).toHaveLength(0);
  });

  test("change store", () => {
    const listener = jest.fn();
    const shape = createShape();
    const store = createStore<string>("");

    listen(shape, store, listener);
    changeStore(shape, store, "/");

    expect(listener.mock.calls).toEqual([["/"]]);
  });

  test("call event / change store from listener", () => {
    const listener = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const store = createStore<string>("");
    const handler = (value: string) => {
      if (value === "e") callEvent(shape, event, "/");
      else if (value === "s") changeStore(shape, store, "_");
    };

    listen(shape, event, listener);
    listen(shape, store, listener);
    listen(shape, event, handler);
    listen(shape, store, handler);
    callEvent(shape, event, "e");
    changeStore(shape, store, "s");

    expect(listener.mock.calls).toEqual([["e"], ["/"], ["s"], ["_"]]);
  });
});

describe("serialize", () => {
  test("empty", () => {
    expect(serialize(createShape())).toEqual({});
  });

  test("with data - serialize", () => {
    const shape = createShape();
    const store = createStore<string>("");

    changeStore(shape, store, "/");

    expect(serialize(shape)).toEqual({});
  });

  test("with data + serialize", () => {
    const shape = createShape();
    const store = createStore<string>("", {
      key: "_",
      serialize: (v) => "__" + v,
      deserialize: () => "",
    });

    changeStore(shape, store, "/");

    expect(serialize(shape)).toEqual({ _: "__/" });
  });
});

describe("setRawData", () => {
  test("default", () => {
    const shape = createShape();
    const rawData = { _: "/" };

    setRawData(shape, rawData);

    expect(getShapeState(shape).scope.rawData).toBe(rawData);
  });
});
