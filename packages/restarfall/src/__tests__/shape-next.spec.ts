import { createShape } from "../shape";
import { createStore } from "../store";
import { createEvent } from "../event";
import { ComponentElement, createComponent } from "../component";
import { useDepend } from "../hooks";

describe("create", () => {
  test("api", () => {
    const shape = createShape();

    expect(shape.type).toBe("shape");
    expect(shape.setRawData).toBeInstanceOf(Function);
    expect(shape.serialize).toBeInstanceOf(Function);
    expect(shape.hasValue).toBeInstanceOf(Function);
    expect(shape.getValue).toBeInstanceOf(Function);
    expect(shape.setValue).toBeInstanceOf(Function);
    expect(shape.callEvent).toBeInstanceOf(Function);
    expect(shape.attach).toBeInstanceOf(Function);
  });
});

describe("values", () => {
  const shape = createShape();
  const $store = createStore("def");

  test("before set", () => {
    expect(shape.hasValue($store)).toBe(false);
    expect(shape.getValue($store)).toBe("def");
  });

  test("after set", () => {
    expect(shape.setValue($store, "test")).toBe(shape);
    expect(shape.hasValue($store)).toBe(true);
    expect(shape.getValue($store)).toBe("test");
  });

  test("get by shape", () => {
    const childShape = createShape(shape);

    expect(childShape.hasValue($store)).toBe(true);
    expect(childShape.getValue($store)).toBe("test");
  });
});

describe("events", () => {
  const shape = createShape();
  const event = createEvent<string>();
  const listener = jest.fn();
  const unlistener = jest.fn();

  test("before call", () => {
    expect(shape.listenEvent(event, listener)).toBeInstanceOf(Function);
    expect(shape.listenEvent(event, unlistener)).toBeInstanceOf(Function);
    expect(shape.unlistenEvent(event, unlistener)).toBe(undefined);
  });

  test("after call", () => {
    expect(shape.callEvent(event, "test1")).toBe(undefined);
    expect(shape.callEvent(event, "test2")).toBe(undefined);
    expect(listener.mock.calls).toHaveLength(2);
    expect(listener.mock.calls[0]).toEqual(["test1", {}]);
    expect(listener.mock.calls[1]).toEqual(["test2", { payload: "test1" }]);
    expect(unlistener.mock.calls).toHaveLength(0);
  });
});

const componentFn = (
  callback: () => ComponentElement | ComponentElement[] | null,
) => {
  const body = jest.fn(callback);
  const component = createComponent(body);
  return { body, component };
};

describe("attach", () => {
  const shape = createShape();
  const eventChild = createEvent<string>();
  const eventChildListener = jest.fn();
  const child = componentFn(() => {
    useDepend(eventChild);
    return null;
  });
  const eventRoot = createEvent<string>();
  const root = componentFn(() => {
    useDepend(eventRoot);
    return [child.component(), child.component()];
  });

  test("before attach", () => {
    shape.listenEvent(eventChild, eventChildListener);

    expect(child.body.mock.calls).toHaveLength(0);
    expect(root.body.mock.calls).toHaveLength(0);
  });

  test("after attach", () => {
    const result = shape.attach(root.component());

    expect(result.wait).toBeInstanceOf(Function);
    expect(child.body.mock.calls).toHaveLength(2);
    expect(root.body.mock.calls).toHaveLength(1);
  });

  test("useDepend", () => {
    shape.callEvent(eventChild, "evc_1");

    expect(eventChildListener.mock.calls).toHaveLength(1);
    expect(child.body.mock.calls).toHaveLength(4);
    expect(root.body.mock.calls).toHaveLength(1);
  });
});

describe("data", () => {
  const shape = createShape();
  const $store = createStore<string>("");
  const body = jest.fn();
  const root = createComponent(body, {
    serialize: (getValue) => ({
      store_value: getValue($store),
    }),
    deserialize: (getValue) => ({
      name: { store: $store, value: getValue("store").value },
    }),
  });

  test("setRawData", () => {
    expect(shape.setRawData({ store: "test_value" })).toBe(shape);

    shape.attach(root());

    expect(shape.getValue($store)).toBe("test_value");
  });

  test("serialize", () => {
    expect(shape.serialize()).toEqual({ store_value: "test_value" });
  });
});
