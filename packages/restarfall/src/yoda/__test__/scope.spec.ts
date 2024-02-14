import { createScope, getEventMeta, getPayload, getValue } from "../scope";
import { createEvent } from "../event";
import { createStore } from "../store";

describe("createScope", () => {
  test("instance", () => {
    expect(createScope()).toEqual({
      payloads: new Map(),
      values: new Map(),
      actions: [],
      currentEvent: null,
      promises: new Set(),
      listeners: new Map(),
      rawData: {},
    });
  });
});

describe("getPayload", () => {
  test("empty", () => {
    const scope = createScope();
    const event = createEvent();

    expect(getPayload(scope, event)).toEqual({});
  });

  test("with value", () => {
    const scope = createScope();
    const event = createEvent<string>();

    scope.payloads.set(event, "/");

    expect(getPayload(scope, event)).toEqual({ value: "/" });
  });
});

describe("getEventMeta", () => {
  test("without called event", () => {
    const scope = createScope();
    const event = createEvent<string>();

    expect(getEventMeta(scope, event)).toEqual({ called: false, payload: {} });
  });

  test("with called event", () => {
    const scope = createScope();
    const event = createEvent<string>();

    scope.currentEvent = event;
    scope.payloads.set(event, "/");

    expect(getEventMeta(scope, event)).toEqual({
      called: true,
      payload: { value: "/" },
    });
  });
});

describe("getValue", () => {
  test("empty", () => {
    const scope = createScope();
    const store = createStore<string>("/");

    expect(getValue(scope, store)).toEqual({});
  });

  test("with value", () => {
    const scope = createScope();
    const store = createStore<string>("/");

    scope.values.set(store, "_");

    expect(getValue(scope, store)).toEqual({ value: "_" });
  });

  test("from rawData", () => {
    const scope = createScope();
    const store = createStore<string>("/", {
      key: "_",
      serialize: () => "",
      deserialize: (v) => v as never,
    });

    scope.rawData = { _: "//" };

    expect(getValue(scope, store)).toEqual({ value: "//" });
    expect(scope.values.get(store)).toBe("//");
  });
});
