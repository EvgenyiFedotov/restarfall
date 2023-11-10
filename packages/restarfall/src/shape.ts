import {
  UnitElement,
  UnitElementInstance,
  DependFilter,
  ShapeApi,
  elements,
} from "./unit";
import { Event } from "./event";
import { Store } from "./store";
import { privateLogger } from "./private-root";

// State [Data]
type ShapeRawData = Record<string, unknown>;

// State [Values]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeValues = Map<Store<unknown>, any>;

// State [Events]
type EventListener<Value> = (value: Value, state: { payload?: Value }) => void;
type ShapeDepends = Map<
  UnitElementInstance,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Set<{ event: Event<unknown>; listener: EventListener<any> }>
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeListeners = Map<EventListener<any>, UnitElementInstance>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeEvents = Map<Event<unknown>, Set<EventListener<any>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapePayloads = Map<Event<unknown>, any>;
type ShapeCalledEvent = Event<unknown> | null;
type ShapeQueueEventCalls = [Event<unknown>, unknown][];

// State [Units]
type ShapeRoots = UnitElementInstance[];

// Methods [Data]
type ShapeGetRawValue = (key: string) => { value?: unknown };
type ShapeDeleteRawValue = (key: string) => void;
type ShapeSetRawData = (rawData: object) => void;
type ShapeSerialize = () => object;

// Methods [Values]
type ShapeHasValue = <Value>(store: Store<Value>) => boolean;
type ShapeGetValue = <Value>(store: Store<Value>) => Value;
type ShapeSetValue = <Value>(store: Store<Value>, value: Value) => void;
type ShapeChangeValue = <Value>(store: Store<Value>, value: Value) => void;
type ShapePushValueChange = <Value>(store: Store<Value>, value: Value) => void;

// Methods [Events]
type ShapeLinkInstance = <Value>(
  instance: UnitElementInstance,
  event: Event<Value>,
  listener: EventListener<Value>,
) => void;
type ShapeUnlinkInstance = (instance: UnitElementInstance) => void;
type ShapeIsCalledEvent = <Value>(event: Event<Value>) => boolean;
type ShapeGetEventState = <Value>(event: Event<Value>) => { payload?: Value };
type ShapeUnlistenEvent = <Value>(
  event: Event<Value>,
  listener: EventListener<Value>,
) => void;
type ShapeListenEvent = <Value>(
  event: Event<Value>,
  listener: EventListener<Value>,
) => () => void;
interface ShapeCallEvent {
  <Value>(event: Event<Value>, value: Value): void;
  (event: Event<void>): void;
}
interface ShapePushEventCall {
  <Value>(event: Event<Value>, value: Value): void;
  (event: Event<void>): void;
}

// Methods [Units]
type ShapeAttach = (element: UnitElement) => void;
type ShapeWait = () => Promise<void>;

// Shape
interface ShapeState {
  // State [Values]
  values: ShapeValues;
}

interface Shape {
  readonly type: "shape";
  readonly key: string | null;

  // Methods [Data]
  readonly setRawData: ShapeSetRawData;
  readonly serialize: ShapeSerialize;

  // Methods [Values]
  readonly hasValue: ShapeHasValue;
  readonly getValue: ShapeGetValue;
  readonly setValue: ShapeSetValue;
  readonly changeValue: ShapeChangeValue;

  // Methods [Events]
  readonly getEventState: ShapeGetEventState;
  readonly unlistenEvent: ShapeUnlistenEvent;
  readonly listenEvent: ShapeListenEvent;
  readonly callEvent: ShapeCallEvent;

  // Methods [Units]
  readonly attach: ShapeAttach;
  readonly wait: ShapeWait;
}

interface CreateShapeOptions {
  parent?: Shape;
  key?: string | null;
}

interface CreateShape {
  (options?: CreateShapeOptions): Shape;
}

const shapes: WeakMap<Shape, ShapeState> = new WeakMap();

const createShape: CreateShape = (options) => {
  const parentState = options?.parent ? shapes.get(options.parent) : null;

  // State
  const rawData: ShapeRawData = {};
  const values: ShapeValues = new Map(parentState ? parentState.values : null);
  const depends: ShapeDepends = new Map();
  const listeners: ShapeListeners = new Map();
  const events: ShapeEvents = new Map();
  const payloads: ShapePayloads = new Map();
  const queueEventCalls: ShapeQueueEventCalls = [];
  let calledEvent: ShapeCalledEvent = null;
  const roots: ShapeRoots = [];

  // Methods
  const getRawValue: ShapeGetRawValue = (key) => {
    return key in rawData ? { value: rawData[key] } : {};
  };
  const deleteRawValue: ShapeDeleteRawValue = (key) => {
    delete rawData[key];
  };
  const setRawData: ShapeSetRawData = (addedRawData) => {
    Object.assign(rawData, addedRawData);
  };
  const serialize: ShapeSerialize = () => {
    const data: object = {};

    roots.forEach((instance) => {
      Object.assign(
        data,
        elements.get(instance.element)?.serialize?.(getValue) ?? {},
      );
      instance.allChidlren.forEach((childInstance) => {
        if (childInstance) {
          Object.assign(
            data,
            elements.get(childInstance.element)?.serialize?.(getValue) ?? {},
          );
        }
      });
    });

    return data;
  };
  const hasValue: ShapeHasValue = (store) => {
    return values.has(store);
  };
  const getValue: ShapeGetValue = (store) => {
    return values.has(store) ? values.get(store) : store.initialValue;
  };
  const setValue: ShapeSetValue = (store, value) => {
    values.set(store, value);
  };
  const changeValue: ShapeChangeValue = (store, value) => {
    const prevValue = getValue(store);

    if (prevValue === value) return;

    setValue(store, value);
    callEvent(store.changed, value);
  };
  const linkInstance: ShapeLinkInstance = (instance, event, listener) => {
    const instanceDepends = depends.get(instance) ?? new Set();

    instanceDepends.add({ event, listener });
    depends.set(instance, instanceDepends);
    listeners.set(listener, instance);
    listenEvent(event, listener);
  };
  const unlinkInstance: ShapeUnlinkInstance = (instance) => {
    depends.get(instance)?.forEach(({ event, listener }) => {
      listeners.delete(listener);
      unlistenEvent(event, listener);
    });
    depends.delete(instance);
  };
  const isCalledEvent: ShapeIsCalledEvent = (event) => {
    return calledEvent === event;
  };
  const getEventState: ShapeGetEventState = (event) => {
    return payloads.has(event) ? { payload: payloads.get(event) } : {};
  };
  const unlistenEvent: ShapeUnlistenEvent = (event, listener) => {
    events.get(event)?.delete(listener);
  };
  const listenEvent: ShapeListenEvent = (event, listener) => {
    const eventListeners = events.get(event) ?? new Set();

    eventListeners.add(listener);
    events.set(event, eventListeners);

    return () => {
      unlistenEvent(event, listener);
    };
  };
  const callEvent: ShapeCallEvent = ((event, value) => {
    const prev = getEventState(event);
    const prevCalledEvent = calledEvent;

    calledEvent = event;
    payloads.set(event, value);

    const instances = roots.reduce<Map<UnitElementInstance, number>>(
      (memo, rootInstance) => {
        memo.set(rootInstance, memo.size);
        rootInstance.allChidlren.forEach((childIntance) => {
          if (childIntance) memo.set(childIntance, memo.size);
        });
        return memo;
      },
      new Map(),
    );

    const dependListeners: Record<number, EventListener<unknown>> = {};
    const outsideListeners: EventListener<unknown>[] = [];

    Array.from(events.get(event) ?? []).forEach((listener) => {
      const instance = listeners.get(listener);

      if (instance) dependListeners[instances.get(instance) ?? -1] = listener;
      else outsideListeners.push(listener);
    });

    for (const key in dependListeners) {
      const listener = dependListeners[key];

      if (listener && events.get(event)?.has(listener)) listener(value, prev);
    }

    for (const listener of outsideListeners) {
      if (events.get(event)?.has(listener)) listener(value, prev);
    }

    calledEvent = prevCalledEvent;
  }) as ShapeCallEvent;
  const pushEventCall: ShapePushEventCall = ((event, value) => {
    queueEventCalls.push([event, value]);
  }) as ShapePushEventCall;
  const pushValueChange: ShapePushValueChange = ((store, value) => {
    const prevValue = getValue(store);

    if (prevValue === value) return;

    setValue(store, value);
    pushEventCall(store.changed, value);
  }) as ShapePushValueChange;
  const attach: ShapeAttach = (element) => {
    const methods = elements.get(element);

    if (!methods) throw new Error("Incorrect element for attach to shape.");

    const shapeApi: ShapeApi = {
      getShape: () => shape,
      getRawValue,
      deleteRawValue,
      getValue,
      setValue,
      getEventState,
      isCalledEvent,
      callEvent: pushEventCall,
      changeValue: pushValueChange,
    };
    const rootInstance = methods.attach(shapeApi);

    shapeApi.callEvent = callEvent;
    shapeApi.changeValue = changeValue;
    roots.push(rootInstance);

    const createListen =
      (instance: UnitElementInstance) =>
      <Value>(filter: DependFilter<Value>, event: Event<Value>): void => {
        const listener: EventListener<Value> = (value, prev) => {
          // filter
          if (filter === false) return;
          if (filter && filter(value, prev) === false) return;

          const prevAllChidlren = new Set(instance.allChidlren);

          // unlink
          unlinkInstance(instance);
          prevAllChidlren.forEach((childInstance) => {
            if (childInstance) unlinkInstance(childInstance);
          });

          // reattach
          shapeApi.callEvent = pushEventCall;
          shapeApi.changeValue = pushValueChange;
          elements.get(instance.element)?.reattach(instance, shapeApi);
          shapeApi.callEvent = callEvent;
          shapeApi.changeValue = changeValue;

          const currAllChildren = new Set(instance.allChidlren);

          // link
          instance.depends.forEach(createListen(instance));
          currAllChildren.forEach((childInstance) => {
            childInstance?.depends.forEach(createListen(childInstance));
          });

          // detach effect
          prevAllChidlren.forEach((childInstance) => {
            if (childInstance && !currAllChildren.has(childInstance)) {
              childInstance.detachEffects.forEach((effect) => effect());
            }
          });

          // attach effect
          currAllChildren.forEach((childInstance) => {
            if (childInstance && !prevAllChidlren.has(childInstance)) {
              childInstance.attachEffects.forEach((effect) => effect());
            }
          });

          // call events from queue
          const listEventCalls = [...queueEventCalls];

          queueEventCalls.length = 0;
          listEventCalls.forEach(([event, payload]) =>
            callEvent(event, payload),
          );
        };

        linkInstance(instance, event, listener);
      };

    // link
    rootInstance.depends.forEach(createListen(rootInstance));
    rootInstance.allChidlren.forEach((childInstance) => {
      childInstance?.depends.forEach(createListen(childInstance));
    });

    // attach effect
    rootInstance.attachEffects.forEach((effect) => effect());
    rootInstance.allChidlren.forEach((childInstance) => {
      childInstance?.attachEffects.forEach((effect) => effect());
    });

    // call events from queue
    const listEventCalls = [...queueEventCalls];

    queueEventCalls.length = 0;
    listEventCalls.forEach(([event, payload]) => callEvent(event, payload));
  };
  const wait: ShapeWait = async () => {
    const getPromises = () => {
      return roots.flatMap((rootInstance) => [
        ...Array.from(rootInstance.promises),
        ...rootInstance.allChidlren.flatMap((child) =>
          child ? Array.from(child.promises) : [],
        ),
      ]);
    };
    const promises: {
      prev: Set<Promise<unknown>>;
      curr: Promise<unknown>[];
      diff: Promise<unknown>[];
    } = {
      prev: new Set(),
      curr: getPromises(),
      diff: [],
    };
    promises.diff = promises.curr.filter(
      (promise) => !promises.prev.has(promise),
    );

    while (promises.diff.length > 0) {
      await Promise.allSettled(promises.diff);
      promises.prev = new Set(promises.curr);
      promises.curr = getPromises();
      promises.diff = promises.curr.filter(
        (promise) => !promises.prev.has(promise),
      );
    }
  };

  // Shape
  const shape: Shape = {
    type: "shape",
    key: options?.key ?? null,

    // Methods [Data]
    setRawData,
    serialize,

    // Methods [Values]
    hasValue,
    getValue,
    setValue,
    changeValue,

    // Methods [Events]
    getEventState,
    unlistenEvent,
    listenEvent,
    callEvent,

    // Methods [Units]
    attach,
    wait,
  };

  shapes.set(shape, { values });
  privateLogger.add({ action: "shape-created", meta: { shape } });

  return shape;
};

const isShape = (value: unknown): value is Shape => {
  return shapes.has(value as never);
};

export type { EventListener, Shape, CreateShape };
export { shapes, createShape, isShape };
