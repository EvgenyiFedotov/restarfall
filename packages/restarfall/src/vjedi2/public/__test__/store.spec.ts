import { createStore, getCoreStore, getInitialValue, isStore } from "../store";

describe("createStore", () => {
  test("instance", () => {
    expect(createStore("")).toEqual({ type: "store" });
  });
});

describe("getCoreStore", () => {
  test("correct", () => {
    const store = createStore("/");
    const coreStore = getCoreStore(store);

    expect(coreStore.initialValue).toBe("/");
    expect(coreStore.changed).toEqual({ type: "event" });
  });

  test("incorrect", () => {
    expect(() => getCoreStore({ type: "store" })).toThrow(
      new Error("Store is incorrect"),
    );
  });
});

describe("getInitialValue", () => {
  test("correct", () => {
    expect(getInitialValue(createStore("/"))).toBe("/");
  });
});

describe("isStore", () => {
  test("correct", () => {
    expect(isStore(createStore(""))).toBe(true);
  });

  test("incorrect", () => {
    expect(isStore({ type: "store" })).toBe(false);
  });
});
