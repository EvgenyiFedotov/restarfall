import { attachElement, createShape, dispatch } from "../shape";
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
      queue: [],
    });
  });
});

describe("dispatch", () => {
  test("by event", () => {
    const shape = createShape();
    const event = createEvent<string>();

    dispatch(shape, shape.scope, event, "/");

    expect(shape.scope.payloads.get(event)).toBe("/");
  });

  test("by event with void parameter", () => {
    const shape = createShape();
    const event = createEvent<void>();

    dispatch(shape, shape.scope, event);

    expect(shape.scope.payloads.has(event)).toBe(true);
  });

  test("by store", () => {
    const shape = createShape();
    const store = createStore<string>("_");

    dispatch(shape, shape.scope, store, "/");

    expect(shape.scope.payloads.get(store.changed)).toBe("/");
    expect(shape.scope.values.get(store)).toBe("/");
  });

  test("with different scope", () => {
    const shape = createShape();
    const event = createEvent<string>();
    const scope = createScope();

    dispatch(shape, scope, event, "/");

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
    dispatch(shape, shape.scope, event);

    expect(log.mock.calls[0][0]).toBe(null);
    expect(log.mock.calls[1][0]).toBe(event);
    expect(shape.scope.calledEvent).toBe(null);
  });
});

describe("attachElement", () => {
  test("check struct", () => {
    const shape = createShape();
    const element = createElement(() => null, []);

    attachElement(shape, element);

    expect(shape.tree.struct).toHaveLength(1);
  });
});
