import { createComponent, elements } from "../component";
import { Event } from "../event";
import { Store, createStore } from "../store";

const apiFn = {
  getRawValue: jest.fn((_key: string) => ({ value: "test" })),
  deleteRawValue: jest.fn((_key: string) => undefined),
  getValue: jest.fn(() => undefined as never),
  setValue: jest.fn((_store: Store<unknown>, _value: unknown) => undefined),
  changeValue: jest.fn((_store: Store<unknown>, _value: unknown) => undefined),
  getEventState: jest.fn(() => ({})),
  callEvent: jest.fn((_event: Event<unknown>, _value: unknown) => undefined),
  isCalledEvent: jest.fn(() => false),
};

describe("component", () => {
  test("default", () => {
    const component = createComponent(() => null);

    expect(component).toBeInstanceOf(Function);
    expect(component.type).toBe("component");
  });

  test("element", () => {
    const component = createComponent(() => null);
    const element1 = component();
    const methods = elements.get(element1);
    const element2 = component();

    expect(Boolean(element1)).toBe(true);
    expect(element1.type).toBe("component-element");
    expect(element1.index).toBe(1);
    expect(element2.index).toBe(2);
    expect(methods?.reattach).toBeInstanceOf(Function);
    expect(methods?.attach).toBeInstanceOf(Function);
    expect(methods?.serialize).toBe(null);
    expect(methods?.deserialize).toBe(null);
  });

  test("with options", () => {
    const component = createComponent(() => null, {
      key: "empty",
      serialize: () => ({}),
      deserialize: () => ({}),
    });
    const element = component();
    const methods = elements.get(element);

    expect(element.key).toBe("empty");
    expect(methods?.serialize).toBeInstanceOf(Function);
    expect(methods?.deserialize).toBeInstanceOf(Function);
  });

  describe("attach", () => {
    beforeEach(() => {
      apiFn.getRawValue.mockClear();
      apiFn.deleteRawValue.mockClear();
      apiFn.getValue.mockClear();
      apiFn.setValue.mockClear();
      apiFn.getEventState.mockClear();
      apiFn.callEvent.mockClear();
      apiFn.isCalledEvent.mockClear();
    });

    test("default", () => {
      const childBody = jest.fn(() => [createComponent(() => null)()]);
      const child = createComponent(childBody)();
      const body = jest.fn(() => child);
      const component = createComponent(body);
      const element = component();
      const methods = elements.get(element);
      const instance = methods?.attach(apiFn);

      expect(instance?.type).toBe("component-instance");
      expect(instance?.api).toBe(apiFn);
      expect(instance?.element).toBe(element);
      expect(instance?.depends).toBeInstanceOf(Map);
      expect(instance?.promises).toBeInstanceOf(Set);
      expect(instance?.children).toHaveLength(1);
      expect(instance?.children[0].type).toBe("component-instance");
      expect(instance?.allChidlren).toHaveLength(2);
      expect(body.mock.results).toHaveLength(1);
      expect(body.mock.results[0].value.type).toBe("component-element");
      expect(childBody.mock.results).toHaveLength(1);
    });

    test("with args", () => {
      const body = jest.fn((_date: Date) => null);
      const component = createComponent(body);
      const element = component(new Date());
      const methods = elements.get(element);

      methods?.attach(apiFn);

      expect(body.mock.calls).toHaveLength(1);
      expect(body.mock.calls[0][0]).toBeInstanceOf(Date);
    });

    test("deserialize", () => {
      const childBody = jest.fn(() => null);
      const child = createComponent(childBody)();
      const body = jest.fn(() => child);
      const $name = createStore("bob");
      const component = createComponent(body, {
        deserialize: (getValue) => ({
          name: { store: $name, value: getValue("name").value },
        }),
      });
      const element = component();
      const methods = elements.get(element);

      methods?.attach(apiFn);

      expect(apiFn.getRawValue.mock.calls[0][0]).toBe("name");
      expect(apiFn.deleteRawValue.mock.calls[0][0]).toBe("name");
      expect(apiFn.setValue.mock.calls[0]).toEqual([$name, "test"]);
    });
  });
});
