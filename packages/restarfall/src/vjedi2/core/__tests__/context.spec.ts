import {
  contextStack,
  getShape,
  getScope,
  getShapeStrict,
  getScopeStrict,
  getCurrentNodeStrict,
} from "../context";
import { createShape } from "../shape";
import { createScope } from "../scope";
import { createNode } from "../tree";
import { createElement } from "../element";

afterEach(() => (contextStack.length = 0));

describe("getShape", () => {
  test("empty", () => {
    expect(getShape()).toBe(undefined);
  });

  test("exist", () => {
    const shape = createShape();

    contextStack.push({ shape });

    expect(getShape()).toBe(shape);
  });
});

describe("getScope", () => {
  test("empty", () => {
    expect(getScope()).toBe(undefined);
  });

  test("exist", () => {
    const shape = createShape();

    contextStack.push({ shape });

    expect(getScope()).toBe(shape.scope);
  });

  test("custom scope", () => {
    const shape = createShape();
    const scope = createScope();

    contextStack.push({ shape, scope });

    expect(getScope()).toBe(scope);
  });
});

describe("getShapeStrict", () => {
  test("empty", () => {
    expect(() => getShapeStrict()).toThrow(new Error("Shape is incorrect."));
  });

  test("exist", () => {
    const shape = createShape();

    contextStack.push({ shape });

    expect(getShapeStrict()).toBe(shape);
  });
});

describe("getScopeStrict", () => {
  test("empty", () => {
    expect(() => getScopeStrict()).toThrow(new Error("Scope is incorrect."));
  });

  test("exist", () => {
    const shape = createShape();

    contextStack.push({ shape });

    expect(getScopeStrict()).toBe(shape.scope);
  });

  test("with custom scope", () => {
    const shape = createShape();
    const scope = createScope();

    contextStack.push({ shape, scope });

    expect(getScopeStrict()).toBe(scope);
  });
});

describe("getScopeStrict", () => {
  test("empty", () => {
    const shape = createShape();

    contextStack.push({ shape });

    expect(() => getCurrentNodeStrict()).toThrow(
      new Error("Current node is incorrect."),
    );
  });

  test("exist", () => {
    const shape = createShape();
    const element = createElement(() => [], []);
    const node = createNode(element);

    contextStack.push({ shape });
    shape.tree.stack.push(node);

    expect(getCurrentNodeStrict()).toBe(node);
  });
});
