import { createElement, getCoreElement, isElement } from "../element";

describe("createElement", () => {
  test("instance", () => {
    expect(createElement(() => [], [])).toEqual({ type: "element" });
  });
});

describe("getCoreElement", () => {
  test("correct", () => {
    expect(getCoreElement(createElement(() => [], []))).toBeInstanceOf(
      Function,
    );
  });

  test("incorrect", () => {
    expect(() => getCoreElement({ type: "element" })).toThrow(
      new Error("Element is incorrect"),
    );
  });

  test("call [null]", () => {
    const element = createElement(() => null, []);
    const coreElement = getCoreElement(element);

    expect(coreElement()).toHaveLength(0);
  });

  test("call [arr]", () => {
    const element = createElement(() => [], []);
    const coreElement = getCoreElement(element);

    expect(coreElement()).toHaveLength(0);
  });

  test("call [child]", () => {
    const child = createElement(() => [], []);
    const parent = createElement(() => child, []);
    const coreElement = getCoreElement(parent);
    const result = coreElement();

    expect(result).toHaveLength(1);
    expect(result[0]).toBe(getCoreElement(child));
  });

  test("call [arr with null]", () => {
    const child = createElement(() => [], []);
    const parent = createElement(() => [child, null], []);
    const coreElement = getCoreElement(parent);
    const result = coreElement();

    expect(result).toHaveLength(2);
    expect(result[0]).toBe(getCoreElement(child));
  });
});

describe("isElement", () => {
  test("correct", () => {
    expect(isElement(createElement(() => [], []))).toBe(true);
  });

  test("incorrect", () => {
    expect(isElement({ type: "element" })).toBe(false);
  });
});
