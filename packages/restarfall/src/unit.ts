import { Event } from "./event";
import { Store } from "./store";
import { Cache, createCache } from "./cache";
import { privateLogger } from "./private-root";

type Serialize = (
  getValue: <Value>(store: Store<Value>) => Value,
) => Record<string, unknown>;

type Deserialize = (
  getValue: (key: string) => { value?: unknown },
) => Partial<Record<string, { store: Store<unknown>; value: unknown }>>;

interface UnitElement {
  readonly type: "unit-element";
  readonly key: string | null;
}

interface Unit<Args extends unknown[]> {
  (...args: Args): UnitElement;
  key: string | null;
  type: "unit";
}

type ChildElement = null | UnitElement;
type ChildrenElements = null | ChildElement | ChildElement[];

interface CreateUnitOptions {
  key?: string | null;
  serialize?: Serialize;
  deserialize?: Deserialize;
}

interface CreateUnit {
  <Args extends unknown[]>(
    body: (...args: Args) => ChildrenElements,
    options?: CreateUnitOptions,
  ): Unit<Args>;
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

interface UnitElementInstance {
  type: "unit-element-instance";
  element: UnitElement;
  depends: Depends;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cache: Cache<any>;
  detachEffects: DetachEffects;
  attachEffects: AttachEffects;
  promises: Promises;
  children: Map<UnitElement | null, UnitElementInstance | null>;
  allChidlren: (UnitElementInstance | null)[];
}

interface ShapeApi {
  getShape: () => object;
  getRawValue: (key: string) => { value?: unknown };
  deleteRawValue: (key: string) => void;
  getValue: <Value>(store: Store<Value>) => Value;
  setValue: <Value>(store: Store<Value>, value: Value) => void;
  changeValue: <Value>(store: Store<Value>, value: Value) => void;
  getEventState: <Value>(event: Event<Value>) => { payload?: Value };
  callEvent: <Value>(event: Event<Value>, value: Value) => void;
  isCalledEvent: <Value>(event: Event<Value>) => boolean;
}

type UnitCall = (instance: UnitElementInstance, shapeApi: ShapeApi) => void;

type UnitReattach = (instance: UnitElementInstance, shapeApi: ShapeApi) => void;

type UnitAttach = (shapeApi: ShapeApi) => UnitElementInstance;

interface UnitElementApi {
  serialize: Serialize | null;
  deserialize: Deserialize | null;
  reattach: UnitReattach;
  attach: UnitAttach;
}

interface UnitContext {
  instance: UnitElementInstance;
  shapeApi: ShapeApi;
}

const elements: WeakMap<UnitElement, UnitElementApi> = new WeakMap();

let currentUnitContext: UnitContext | null = null;

const toUnitElementArray = (children: ChildrenElements): ChildElement[] => {
  return children ? (Array.isArray(children) ? children : [children]) : [];
};

const units: WeakSet<Unit<never>> = new WeakSet();

const createUnit: CreateUnit = (body, options) => {
  const unit: Unit<Parameters<typeof body>> = (...args) => {
    const element: UnitElement = {
      type: "unit-element",
      key: options?.key ?? null,
    };

    const call: UnitCall = (instance, shapeApi) => {
      const previousUnitContext = currentUnitContext;
      const children = instance.children;

      instance.depends = new Map();
      instance.promises = new Set();
      instance.children = new Map();

      currentUnitContext = { instance, shapeApi };

      // deserialize
      Object.entries(
        options?.deserialize?.(shapeApi.getRawValue) ?? {},
      ).forEach(([key, params]) => {
        if (!params) return;

        shapeApi.deleteRawValue(key);
        shapeApi.setValue(params.store, params.value);
      });

      toUnitElementArray(body(...args)).forEach((element) => {
        if (!element) {
          instance.children.set(null, null);
          return;
        }

        const elementApi = elements.get(element);

        if (!elementApi) return;

        if (children.has(element)) {
          const child = children.get(element);

          if (!child) return;

          elementApi.reattach(child, shapeApi);
          instance.children.set(element, child);
          return;
        }

        instance.children.set(element, elementApi.attach(shapeApi));
      });

      currentUnitContext = previousUnitContext;
    };

    const reattach: UnitReattach = (instance, shapeApi) => {
      const detachEffects = instance.detachEffects;
      const attachEffects = instance.attachEffects;

      instance.detachEffects = new Set();
      instance.attachEffects = new Set();

      call(instance, shapeApi);

      instance.detachEffects = detachEffects;
      instance.attachEffects = attachEffects;

      privateLogger.add({
        action: "element-re-attached",
        meta: { unit, element, shape: shapeApi.getShape() },
      });
    };

    const attach: UnitAttach = (shapeApi) => {
      const instance: UnitElementInstance = {
        type: "unit-element-instance",
        element,
        depends: new Map(),
        cache: createCache(),
        detachEffects: new Set(),
        attachEffects: new Set(),
        promises: new Set(),
        children: new Map(),
        get allChidlren() {
          return [...instance.children.values()].flatMap((child) =>
            child ? [child, ...child.allChidlren] : [child],
          );
        },
      };

      call(instance, shapeApi);

      privateLogger.add({
        action: "element-attached",
        meta: { unit, element, shape: shapeApi.getShape() },
      });

      return instance;
    };

    elements.set(element, {
      serialize: options?.serialize ?? null,
      deserialize: options?.deserialize ?? null,
      reattach,
      attach,
    });

    privateLogger.add({ action: "element-created", meta: { unit, element } });

    return element;
  };

  unit.type = "unit";
  unit.key = options?.key ?? null;

  units.add(unit);
  privateLogger.add({ action: "unit-created", meta: { unit } });

  return unit;
};

const isUnit = <Args extends unknown[]>(
  value: unknown,
): value is Unit<Args> => {
  return units.has(value as never);
};

const isElement = (value: unknown): value is UnitElement => {
  return elements.has(value as never);
};

export type {
  UnitElement,
  Unit,
  CreateUnit,
  ChildrenElements,
  DependFilter,
  UnitElementInstance,
  ShapeApi,
  UnitContext,
};
export {
  elements,
  currentUnitContext,
  toUnitElementArray,
  units,
  createUnit,
  isUnit,
  isElement,
};
