import { isElement } from "../element";
import { createUnit, isUnit } from "../unit";

describe("createUnit", () => {
  test("instance", () => {
    const unit = createUnit(() => []);

    expect(unit).toBeInstanceOf(Function);
    expect(unit.type).toBe("unit");
  });

  test("with children", () => {
    const child = createUnit(() => []);
    const parent = createUnit(() => [child(), child()]);

    expect(isElement(parent())).toBe(true);
  });

  test("with params", () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const unit = createUnit((name: string, age: number) => []);

    expect(isElement(unit("", 0))).toBe(true);
  });
});

describe("isUnit", () => {
  test("correct", () => {
    expect(isUnit(createUnit(() => []))).toBe(true);
  });

  test("incorrect", () => {
    expect(isUnit(() => [])).toBe(false);
  });
});
