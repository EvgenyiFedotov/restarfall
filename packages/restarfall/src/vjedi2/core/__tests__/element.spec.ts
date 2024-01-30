import { createElement } from "../element";

describe("createElement", () => {
  test("instance", () => {
    const element = createElement(() => null, []);

    expect(element).toBeInstanceOf(Function);
  });
});

describe("call element", () => {
  test("children is null", () => {
    const element = createElement(() => null, []);
    const children = element();

    expect(children).toHaveLength(0);
  });

  test("children is element", () => {
    const child = createElement(() => null, []);
    const parent = createElement(() => child, []);
    const children = parent();

    expect(children).toHaveLength(1);
    expect(children[0]).toBe(child);
  });

  test("children is array", () => {
    const child0 = createElement(() => null, []);
    const child1 = createElement(() => null, []);
    const parent = createElement(() => [child0, null, child1, null], []);
    const children = parent();

    expect(children).toHaveLength(4);
    expect(children[0]).toBe(child0);
    expect(children[1]).toBe(null);
    expect(children[2]).toBe(child1);
    expect(children[3]).toBe(null);
  });
});
