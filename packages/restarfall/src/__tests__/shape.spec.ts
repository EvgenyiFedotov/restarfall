import { createComponent } from "../component";
import { createEvent } from "../event";
import { createShape } from "../shape";
import { createStore } from "../store";

describe("create", () => {
  test("default", () => {
    const shape = createShape();

    expect(shape.type).toBe("shape");
    expect(shape.hasValue).toBeInstanceOf(Function);
    expect(shape.getValue).toBeInstanceOf(Function);
    expect(shape.setValue).toBeInstanceOf(Function);
    expect(shape.unlistenEvent).toBeInstanceOf(Function);
    expect(shape.listenEvent).toBeInstanceOf(Function);
    expect(shape.callEvent).toBeInstanceOf(Function);
    expect(shape.attach).toBeInstanceOf(Function);
    expect(shape.serialize).toBeInstanceOf(Function);
    expect(shape.setRawData).toBeInstanceOf(Function);
  });
});

describe("values", () => {
  const shape = createShape();
  const $name = createStore<string>("bob");

  test("hasValue", () => {
    expect(shape.hasValue($name)).toBe(false);
  });

  test("getValue", () => {
    expect(shape.getValue($name)).toBe($name.initialValue);
  });

  test("setValue", () => {
    expect(shape.setValue($name, "test")).toBe(shape);
    expect(shape.hasValue($name)).toBe(true);
    expect(shape.getValue($name)).toBe("test");
  });

  test("values by parent shape", () => {
    const parentShape = createShape().setValue($name, "simple");
    const shape = createShape(parentShape);

    parentShape.setValue($name, "test");

    expect(parentShape.getValue($name)).toBe("test");
    expect(shape.getValue($name)).toBe("simple");
  });
});

describe("events", () => {
  const shape = createShape();
  const firstListener = jest.fn(() => {});
  const secondListener = jest.fn(() => {});
  const send = createEvent<string>();

  test("listenEvent", () => {
    expect(shape.listenEvent(send, firstListener)).toBeInstanceOf(Function);
  });

  test("unlistenEvent", () => {
    expect(shape.unlistenEvent(send, firstListener)).toBe(undefined);
    expect(shape.listenEvent(send, secondListener)()).toBe(undefined);
  });

  test("callEvent", () => {
    const innerListener = jest.fn((_value: string) => {});
    const clear = createEvent<void>();

    shape.listenEvent(send, innerListener);
    shape.callEvent(send, "test");
    shape.callEvent(clear, undefined);

    expect(firstListener.mock.calls).toHaveLength(0);
    expect(secondListener.mock.calls).toHaveLength(0);
    expect(innerListener.mock.calls[0][0]).toBe("test");
  });
});

describe("attach", () => {
  const shape = createShape();

  test("failure element", () => {
    expect(() =>
      shape.attach({ type: "component-element", index: 1, key: null }),
    ).toThrow();
  });

  test("default", () => {
    const childBody = jest.fn();
    const body = jest.fn(() => createComponent(childBody)());
    const component = createComponent(body);
    const result = shape.attach(component());

    expect(result.wait).toBeInstanceOf(Function);
    expect(body.mock.calls).toHaveLength(1);
    expect(childBody.mock.calls).toHaveLength(1);
  });

  test("wait", async () => {
    const childBody = jest.fn();
    const body = jest.fn(() => createComponent(childBody)());
    const component = createComponent(body);
    const result = shape.attach(component());

    expect(() => result.wait()).not.toThrow();
  });
});

describe("serialize", () => {
  test("default", () => {
    const $name = createStore<string>("");
    const childBody = jest.fn();
    const body = jest.fn(() => createComponent(childBody)());
    const serialize = jest.fn((getValue) => ({ name: getValue($name) }));
    const component = createComponent(body, { serialize });
    const shape = createShape();

    shape.attach(component());
    shape.setValue($name, "test");

    expect(shape.serialize()).toEqual({ name: "test" });
    expect(serialize.mock.calls).toHaveLength(1);
  });

  test("setRawData", () => {
    const $name = createStore<string>("");
    const body = jest.fn(() => null);
    const deserialize = jest.fn((getValue) => ({
      name: { store: $name, value: getValue("name").value },
    }));
    const component = createComponent(body, { deserialize });
    const shape = createShape();

    shape.setRawData({ name: "test" });
    shape.attach(component());

    expect(shape.getValue($name)).toBe("test");
  });
});
