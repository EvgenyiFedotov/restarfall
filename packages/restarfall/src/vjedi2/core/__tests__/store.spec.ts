import { createEvent } from "../event";
import { createStore } from "../store";

describe("createStore", () => {
  test("instance", () => {
    const store = createStore("/");

    expect(store.initialValue).toBe("/");
    expect(store.changed).toEqual({ type: "event" });
  });

  test("with changed event", () => {
    const changed = createEvent<string>();
    const store = createStore("/", changed);

    expect(store.changed).toBe(changed);
  });
});
