import { root, getContext, getContextStrict } from "../root";
import { createTree } from "../tree";
import { createScope } from "../scope";

const tree = createTree();
const scope = createScope();

beforeEach(() => {
  root.stack = [];
});

describe("getContext", () => {
  test("exist", () => {
    root.stack.push({ tree, scope });

    expect(getContext()?.tree).toBe(tree);
    expect(getContext()?.scope).toBe(scope);
  });

  test("empty", () => {
    expect(getContext()).toBe(undefined);
  });
});

describe("getContextStrict", () => {
  test("correct", () => {
    root.stack.push({ tree, scope });

    expect(getContextStrict().tree).toBe(tree);
    expect(getContextStrict().scope).toBe(scope);
  });

  test("incorrect", () => {
    expect(() => getContextStrict()).toThrow(new Error("Context is empty."));
  });
});
