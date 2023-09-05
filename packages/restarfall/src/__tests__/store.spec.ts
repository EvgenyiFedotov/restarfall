import { createStore } from "../store";

test("default", () => {
  const $store = createStore<string>("def");

  expect($store.type).toBe("store");
  expect($store.key).toBe(null);
  expect($store.initialValue).toBe("def");
  expect($store.changed.type).toBe("event");
});

test("with options", () => {
  const $store = createStore<string>("def", { key: "field" });

  expect($store.key).toBe("field");
  expect($store.changed.key).toBe("field_changed");
});
