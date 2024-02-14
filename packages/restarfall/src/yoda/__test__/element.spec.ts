import {
  toChildList,
  createElement,
  isElement,
  getBodyWrapper,
} from "../element";

describe("toChildList", () => {
  test("use null", () => {
    expect(toChildList(null)).toEqual([]);
  });

  test("use element", () => {
    expect(toChildList({ type: "element" })).toEqual([{ type: "element" }]);
  });

  test("use array", () => {
    expect(
      toChildList([{ type: "element" }, null, { type: "element" }]),
    ).toEqual([{ type: "element" }, null, { type: "element" }]);
  });
});

describe("createElement", () => {
  test("correct", () => {
    expect(createElement(() => null, [])).toEqual({ type: "element" });
  });
});

describe("isElement", () => {
  test("correct", () => {
    expect(isElement(createElement(() => null, []))).toBe(true);
  });

  test("incorrect", () => {
    expect(isElement({ type: "element" })).toBe(false);
  });
});

describe("getBodyWrapper", () => {
  test("correct", () => {
    expect(getBodyWrapper(createElement(() => null, []))).toBeInstanceOf(
      Function,
    );
  });

  test("incorrect", () => {
    expect(() => getBodyWrapper({ type: "element" })).toThrow(
      new Error("Element is incorrect"),
    );
  });
});

describe("call body wrapper", () => {
  const child = createElement(() => null, []);

  test("without children", () => {
    expect(getBodyWrapper(createElement(() => null, []))()).toEqual([]);
  });

  test("with one child", () => {
    expect(getBodyWrapper(createElement(() => child, []))()).toEqual([child]);
  });

  test("with children", () => {
    expect(getBodyWrapper(createElement(() => [child, child], []))()).toEqual([
      child,
      child,
    ]);
  });
});
