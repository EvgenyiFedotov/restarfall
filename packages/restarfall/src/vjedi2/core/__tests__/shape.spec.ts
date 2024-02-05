import { createShape, attachElement, callEvent, changeValue } from "../shape";
import { createScope } from "../scope";
import { attachNode, createNode, createTree } from "../tree";
import { createEvent } from "../event";
import { createElement } from "../element";
import { createStore } from "../store";
import { contextStack, getCurrentNodeStrict } from "../context";

const log = jest.fn();

beforeEach(() => log.mockReset());
beforeEach(() => (contextStack.length = 0));

describe("createShape", () => {
  test("instance", () => {
    expect(createShape()).toEqual({
      scope: createScope(),
      tree: createTree(),
    });
  });
});

describe("attachElement", () => {
  test("check struct", () => {
    const shape = createShape();
    const element = createElement(() => null, []);

    attachElement(shape, element);

    expect(shape.tree.struct).toHaveLength(1);
  });

  test("attached", () => {
    const detached = jest.fn();
    const attached = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      getCurrentNodeStrict().depends.push({ event, filter: null });
      getCurrentNodeStrict().effects.detached.add(detached);
      getCurrentNodeStrict().effects.attached.add(attached);
      return new Array(4).fill(null).map(() => createElement(() => [], []));
    }, []);

    attachElement(shape, element);
    attachElement(shape, element);
    callEvent(shape, shape.scope, event, "/");

    expect(detached.mock.calls).toHaveLength(0);
    expect(attached.mock.calls).toHaveLength(2);
  });

  test("dettached", () => {
    const detached = jest.fn();
    const attached = jest.fn();
    const shape = createShape();
    const event = createEvent<string>();
    const element = createElement(() => {
      getCurrentNodeStrict().depends.push({ event, filter: null });
      return new Array(4).fill(null).map(() =>
        createElement(() => {
          getCurrentNodeStrict().effects.detached.add(detached);
          getCurrentNodeStrict().effects.attached.add(attached);
          return [];
        }, []),
      );
    }, []);

    attachElement(shape, element);
    attachElement(shape, element);
    callEvent(shape, shape.scope, event, "/");

    expect(detached.mock.calls).toHaveLength(8);
    expect(attached.mock.calls).toHaveLength(16);
  });
});

describe("callEvent", () => {
  test("with parameter", () => {
    const shape = createShape();
    const event = createEvent<string>();

    callEvent(shape, shape.scope, event, "/");

    expect(shape.scope.payloads.get(event)).toBe("/");
  });

  test("without parameter", () => {
    const shape = createShape();
    const event = createEvent<void>();

    callEvent(shape, shape.scope, event, undefined);

    expect(shape.scope.payloads.has(event)).toBe(true);
  });

  test("with different scope", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const scope = createScope();

    callEvent(shape, scope, event, "/");

    expect(shape.scope.payloads.has(event)).toBe(false);
    expect(scope.payloads.has(event)).toBe(true);
  });

  test("calledEvent", () => {
    const shape = createShape();
    const event = createEvent<void>();
    const element = createElement(() => {
      getCurrentNodeStrict().depends.push({ event, filter: null });
      log(shape.scope.calledEvent);
      return [];
    }, []);
    const node = createNode(element);

    contextStack.push({ shape });
    attachNode(shape.tree, node);
    contextStack.pop();
    callEvent(shape, shape.scope, event, undefined);

    expect(log.mock.calls[0][0]).toBe(null);
    expect(log.mock.calls[1][0]).toBe(event);
    expect(shape.scope.calledEvent).toBe(null);
  });
});

describe("changeValue", () => {
  test("default", () => {
    const shape = createShape();
    const store = createStore<string>("_");

    changeValue(shape, shape.scope, store, "/");

    expect(shape.scope.payloads.get(store.changed)).toBe("/");
    expect(shape.scope.values.get(store)).toBe("/");
  });

  test("force", () => {
    const shape = createShape();
    const store = createStore<string>("_");

    changeValue(shape, shape.scope, store, "/", true);

    expect(shape.scope.payloads.get(store.changed)).toBe("/");
    expect(shape.scope.values.get(store)).toBe("/");
  });
});
