import { createScope } from "../../core/scope";
import { createTree } from "../../core/tree";

import {
  attachElement,
  dispatch,
  createShape,
  getCoreShape,
  isShape,
  wait,
} from "../shape";
import { createElement } from "../element";
import { createEvent, getCoreEvent } from "../event";
import { createStore, getCoreStore } from "../store";

describe("createShape", () => {
  test("instance", () => {
    expect(createShape()).toEqual({ type: "shape" });
  });
});

describe("getCoreShape", () => {
  test("correct", () => {
    expect(getCoreShape(createShape())).toEqual({
      scope: createScope(),
      tree: createTree(),
    });
  });

  test("incorrect", () => {
    expect(() => getCoreShape({ type: "shape" })).toThrow(
      new Error("Shape is incorrect"),
    );
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

describe("attachElement", () => {
  test("default", () => {
    const shape = createShape();
    const element = createElement(() => [], []);

    attachElement(shape, element);

    expect(getCoreShape(shape).tree.struct).toHaveLength(1);
  });
});

describe("dispatch", () => {
  test("by event", () => {
    const log = jest.fn();
    const shape = createShape();
    const coreShape = getCoreShape(shape);
    const event = createEvent<string>();
    const coreEvent = getCoreEvent(event);
    const element = createElement(() => {
      log();
      return [];
    }, []);

    attachElement(shape, element);
    coreShape.tree.struct[0].depends.push({ event: coreEvent, filter: null });
    dispatch(shape, event, "/");

    expect(log.mock.calls).toHaveLength(2);
    expect(coreShape.scope.payloads.get(coreEvent)).toBe("/");
  });

  test("by event [void]", () => {
    const log = jest.fn();
    const shape = createShape();
    const coreShape = getCoreShape(shape);
    const event = createEvent<void>();
    const coreEvent = getCoreEvent(event);
    const element = createElement(() => {
      log();
      return [];
    }, []);

    attachElement(shape, element);
    coreShape.tree.struct[0].depends.push({ event: coreEvent, filter: null });
    dispatch(shape, event);

    expect(log.mock.calls).toHaveLength(2);
    expect(coreShape.scope.payloads.has(coreEvent)).toBe(true);
  });

  test("by store", () => {
    const log = jest.fn();
    const shape = createShape();
    const coreShape = getCoreShape(shape);
    const store = createStore<string>("_");
    const coreStore = getCoreStore(store);
    const element = createElement(() => {
      log();
      return [];
    }, []);

    attachElement(shape, element);
    coreShape.tree.struct[0].depends.push({
      event: coreStore.changed,
      filter: null,
    });
    dispatch(shape, store, "/");

    expect(log.mock.calls).toHaveLength(2);
    expect(coreShape.scope.payloads.get(coreStore.changed)).toBe("/");
    expect(coreShape.scope.values.get(coreStore)).toBe("/");
  });
});

describe("wait", () => {
  test("1 level", async () => {
    const log = jest.fn();
    const shape = createShape();
    const element = createElement(() => [], []);

    attachElement(shape, element);
    getCoreShape(shape).scope.promises.add(
      new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
          log();
        }, 200);
      }),
    );
    await wait(shape);

    expect(log.mock.calls).toHaveLength(1);
  });
});
