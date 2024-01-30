import { createEvent } from "../event";
import { createStore } from "../store";
import { createScope, getEventMeta, getPayload, getValue } from "../scope";

describe("createScope", () => {
  test("instance", () => {
    const scope = createScope();

    expect(scope).toEqual({
      payloads: new Map(),
      values: new Map(),
      calledEvent: null,
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

    scope.calledEvent = event;
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
});
