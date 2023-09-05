import { Event } from "./event";
import { Store } from "./store";

type Serialize = (
  getValue: <Value>(store: Store<Value>) => Value,
) => Record<string, unknown>;

type Deserialize = (
  getValue: (key: string) => { value?: unknown },
) => Partial<Record<string, { store: Store<unknown>; value: unknown }>>;

export interface Component<Args extends unknown[]> {
  (...args: Args): ComponentElement;
  type: "component";
}

export interface ComponentElement {
  readonly type: "component-element";
  readonly key: string | null;
  readonly index: number;
}

export type Children = null | ComponentElement | ComponentElement[];

export type DependFilter<Value> = (
  value: Value,
  params: { payload?: Value },
) => boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Depends = Map<Event<any>, DependFilter<any> | false | null>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Promises = Set<Promise<any>>;

export interface ComponentInstance {
  type: "component-instance";
  api: ComponentApi; // del
  element: ComponentElement;
  depends: Depends;
  promises: Promises;
  children: ComponentInstance[];
  allChidlren: ComponentInstance[];
}

export interface ComponentApi {
  getRawValue: (key: string) => { value?: unknown };
  deleteRawValue: (key: string) => void;
  getValue: <Value>(store: Store<Value>) => Value;
  setValue: <Value>(store: Store<Value>, value: Value) => void;
  getEventState: <Value>(event: Event<Value>) => { payload?: Value };
  callEvent: <Value>(event: Event<Value>, value: Value) => void;
  isCallEvent: <Value>(event: Event<Value>) => boolean;
}

type ComponentReattach = (
  instance: ComponentInstance,
  api: ComponentApi,
) => void;

type ComponentAttach = (api: ComponentApi) => ComponentInstance;

export const elements: WeakMap<
  ComponentElement,
  {
    serialize: Serialize | null;
    deserialize: Deserialize | null;
    reattach: ComponentReattach;
    attach: ComponentAttach;
  }
> = new WeakMap();

export const stackInstances: ComponentInstance[] = [];

export const toChildren = (value: Children): ComponentElement[] => {
  return value ? (Array.isArray(value) ? value : [value]) : [];
};

export const createComponent = <Args extends unknown[]>(
  body: (...args: Args) => Children,
  options?: {
    key?: string | null;
    serialize?: Serialize;
    deserialize?: Deserialize;
  },
): Component<Args> => {
  let index = 0;

  const component: Component<Args> = (...args) => {
    const element: ComponentElement = {
      type: "component-element",
      key: options?.key ?? null,
      index: (index += 1),
    };

    const reattach: ComponentReattach = (instance, api) => {
      instance.depends = new Map();
      instance.promises = new Set();
      instance.children = [];
      // instance.allChidlren = [];

      stackInstances.push(instance);

      Object.entries(options?.deserialize?.(api.getRawValue) ?? {}).forEach(
        ([key, params]) => {
          if (!params) return;

          api.deleteRawValue(key);
          api.setValue(params.store, params.value);
        },
      );

      toChildren(body(...args)).forEach((child) => {
        const childInstance = elements.get(child)?.attach(api);

        if (!childInstance) return;

        instance.children.push(childInstance);
      });

      stackInstances.pop();
    };

    const attach: ComponentAttach = (api) => {
      const instance: ComponentInstance = {
        type: "component-instance",
        api,
        element,
        depends: new Map(),
        promises: new Set(),
        children: [],
        get allChidlren() {
          return instance.children.flatMap((child) => [
            child,
            ...child.allChidlren,
          ]);
        },
      };

      reattach(instance, api);

      return instance;
    };

    elements.set(element, {
      serialize: options?.serialize ?? null,
      deserialize: options?.deserialize ?? null,
      reattach,
      attach,
    });

    return element;
  };

  component.type = "component";

  return component;
};
