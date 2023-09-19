import { Event } from "./event";
import { Store } from "./store";
import { Cache, createCache } from "./cache";

type Serialize = (
  getValue: <Value>(store: Store<Value>) => Value,
) => Record<string, unknown>;

type Deserialize = (
  getValue: (key: string) => { value?: unknown },
) => Partial<Record<string, { store: Store<unknown>; value: unknown }>>;

interface ComponentElement {
  readonly type: "component-element";
  readonly key: string | null;
  readonly index: number;
}

interface Component<Args extends unknown[]> {
  (...args: Args): ComponentElement;
  type: "component";
}

type ChildElement = null | ComponentElement;

type ChildrenElements = null | ChildElement | ChildElement[];

interface CreateComponentOptions {
  key?: string | null;
  serialize?: Serialize;
  deserialize?: Deserialize;
}

interface CreateComponent {
  <Args extends unknown[]>(
    body: (...args: Args) => ChildrenElements,
    options?: CreateComponentOptions,
  ): Component<Args>;
}

type DependFilter<Value> =
  | ((value: Value, params: { payload?: Value }) => boolean)
  | undefined
  | false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Depends = Map<Event<any>, DependFilter<any>>;

type DetachEffects = Set<() => void>;

type AttachEffects = Set<() => void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Promises = Set<Promise<any>>;

interface ComponentInstance {
  type: "component-instance";
  api: ComponentApi; // TODO Remove
  element: ComponentElement;
  depends: Depends;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Cache<any>;
  detachEffects: DetachEffects;
  attachEffects: AttachEffects;
  promises: Promises;
  children: ComponentInstance[];
  allChidlren: ComponentInstance[];
}

interface ComponentApi {
  getRawValue: (key: string) => { value?: unknown };
  deleteRawValue: (key: string) => void;
  getValue: <Value>(store: Store<Value>) => Value;
  setValue: <Value>(store: Store<Value>, value: Value) => void;
  changeValue: <Value>(store: Store<Value>, value: Value) => void;
  getEventState: <Value>(event: Event<Value>) => { payload?: Value };
  callEvent: <Value>(event: Event<Value>, value: Value) => void;
  isCalledEvent: <Value>(event: Event<Value>) => boolean;
}

type ComponentReattach = (
  instance: ComponentInstance,
  api: ComponentApi,
  isAttach?: boolean,
) => void;

type ComponentAttach = (api: ComponentApi) => ComponentInstance;

const elements: WeakMap<
  ComponentElement,
  {
    serialize: Serialize | null;
    deserialize: Deserialize | null;
    reattach: ComponentReattach;
    attach: ComponentAttach;
  }
> = new WeakMap();

const stackInstances: ComponentInstance[] = [];

const toChildrenElements = (value: ChildrenElements): ChildElement[] => {
  return value ? (Array.isArray(value) ? value : [value]) : [];
};

const createComponent: CreateComponent = (body, options) => {
  let index = 0;

  const component: Component<Parameters<typeof body>> = (...args) => {
    const element: ComponentElement = {
      type: "component-element",
      key: options?.key ?? null,
      index: (index += 1),
    };

    const reattach: ComponentReattach = (instance, api, isAttach = false) => {
      const children = instance.children;
      const detachEffects = instance.detachEffects;
      const attachEffects = instance.attachEffects;

      instance.depends = new Map();
      instance.detachEffects = new Set();
      instance.attachEffects = new Set();
      instance.promises = new Set();
      instance.children = [];

      stackInstances.push(instance);

      Object.entries(options?.deserialize?.(api.getRawValue) ?? {}).forEach(
        ([key, params]) => {
          if (!params) return;

          api.deleteRawValue(key);
          api.setValue(params.store, params.value);
        },
      );

      toChildrenElements(body(...args)).forEach((element, index) => {
        if (!element) return;

        const elementApi = elements.get(element);

        if (!elementApi) return;

        if (element === children[index]?.element) {
          const child = children[index];

          elementApi.reattach(child, api);
          instance.children.push(child);
          return;
        }

        instance.children.push(elementApi.attach(api));
      });

      if (!isAttach) {
        instance.detachEffects = detachEffects;
        instance.attachEffects = attachEffects;
      }

      stackInstances.pop();
    };

    const attach: ComponentAttach = (api) => {
      const instance: ComponentInstance = {
        type: "component-instance",
        api,
        element,
        depends: new Map(),
        cache: createCache(),
        detachEffects: new Set(),
        attachEffects: new Set(),
        promises: new Set(),
        children: [],
        get allChidlren() {
          return instance.children.flatMap((child) => [
            child,
            ...child.allChidlren,
          ]);
        },
      };

      reattach(instance, api, true);

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

export type {
  ComponentElement,
  Component,
  CreateComponent,
  ChildrenElements,
  DependFilter,
  ComponentInstance,
  ComponentApi,
};
export { elements, stackInstances, toChildrenElements, createComponent };
