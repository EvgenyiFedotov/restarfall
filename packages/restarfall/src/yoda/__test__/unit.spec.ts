import { createUnit, isUnit } from "../unit";

describe("createUnit", () => {
  test("instance", () => {
    const unit = createUnit(() => null);

    expect(unit).toBeInstanceOf(Function);
    expect(unit.type).toBe("unit");
  });

  test("call", () => {
    expect(createUnit(() => null)()).toEqual({ type: "element" });
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
