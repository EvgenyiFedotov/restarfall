import { createStore } from "../store";

describe("createStore", () => {
  test("instance", () => {
    const store = createStore("/");

    expect(store.initialValue).toBe("/");
    expect(store.changed).toEqual({ type: "event" });
  });
});
