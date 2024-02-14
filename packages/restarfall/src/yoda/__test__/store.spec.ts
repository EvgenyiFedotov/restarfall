import { createEvent } from "../event";
import {
  createStore,
  getInitialValue,
  getStoreState,
  isStore,
  getStoreMeta,
} from "../store";

describe("createStore", () => {
  test("correct", () => {
    expect(createStore(null)).toEqual({ type: "store" });
  });
});

describe("isStore", () => {
  test("correct", () => {
    expect(isStore(createStore(null))).toBe(true);
  });

  test("incorrect", () => {
    expect(isStore({})).toBe(false);
  });
});

describe("getStoreState", () => {
  test("correct", () => {
    expect(getStoreState(createStore("__"))).toEqual({
      value: "__",
      changed: createEvent(),
    });
  });

  test("incorrect", () => {
    expect(() => getStoreState({ type: "store" })).toThrow(
      new Error("Store is incorrect"),
    );
  });
});

describe("getInitialValue", () => {
  test("correct", () => {
    expect(getInitialValue(createStore("__"))).toBe("__");
  });

  test("incorrect", () => {
    expect(() => getInitialValue({ type: "store" })).toThrow(
      new Error("Store is incorrect"),
    );
  });
});

describe("getStoreConverter", () => {
  test("store without key", () => {
    expect(getStoreMeta(createStore(""))).toBe(null);
  });

  test("store with key", () => {
    const serialize = () => "";
    const deserialize = () => "";
    const store = createStore("", { key: "_", serialize, deserialize });
    const meta = getStoreMeta(store);

    expect(meta?.key).toBe("_");
    expect(meta?.converter.serialize).toBe(serialize);
    expect(meta?.converter.deserialize).toBe(deserialize);
  });

  test("use the same key in two stores", () => {
    const serialize = () => "";
    const deserialize = () => "";
    const store1 = createStore("", { key: "_", serialize, deserialize });
    const store2 = createStore("", { key: "_", serialize, deserialize });

    expect(getStoreMeta(store1)).toBe(null);
    expect(getStoreMeta(store2)).toBe(null);
  });
});
