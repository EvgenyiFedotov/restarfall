import {
  ComponentElement,
  ComponentInstance,
  DependFilter,
  elements,
} from "./component";
import { Event } from "./event";
import { Store } from "./store";

// State [Data]
type ShapeRawData = Record<string, unknown>;

// State [Values]
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeValues = Map<Store<unknown>, any>;

// State [Events]
type EventListener<Value> = (value: Value, state: { payload?: Value }) => void;
type ShapeDepends = Map<
  ComponentInstance,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Set<{ event: Event<unknown>; listener: EventListener<any> }>
>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeListeners = Map<EventListener<any>, ComponentInstance>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapeEvents = Map<Event<unknown>, Set<EventListener<any>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ShapePayloads = Map<Event<unknown>, any>;
type ShapeCalledEvent = Event<unknown> | null;

// State [Components]
type ShapeRoots = ComponentInstance[];

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

// Methods [Events]
type ShapeLinkInstance = <Value>(
  instance: ComponentInstance,
  event: Event<Value>,
  listener: EventListener<Value>,
) => void;
type ShapeUnlinkInstance = (instance: ComponentInstance) => void;
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

// Methods [Components]
type ShapeAttach = (element: ComponentElement) => void;
type ShapeWait = () => Promise<void>;

// Shape
interface ShapeState {
  // State [Values]
  values: ShapeValues;
}

interface Shape {
  type: "shape";

  // Methods [Data]
  setRawData: ShapeSetRawData;
  serialize: ShapeSerialize;

  // Methods [Values]
  hasValue: ShapeHasValue;
  getValue: ShapeGetValue;
  setValue: ShapeSetValue;
  changeValue: ShapeChangeValue;

  // Methods [Events]
  getEventState: ShapeGetEventState;
  unlistenEvent: ShapeUnlistenEvent;
  listenEvent: ShapeListenEvent;
  callEvent: ShapeCallEvent;

  // Methods [Components]
  attach: ShapeAttach;
  wait: ShapeWait;
}

interface CreateShape {
  (parent?: Shape): Shape;
}

const shapes: WeakMap<Shape, ShapeState> = new WeakMap();

const createShape: CreateShape = (parent) => {
  const parentState = parent ? shapes.get(parent) : null;

  // State
  const rawData: ShapeRawData = {};
  const values: ShapeValues = new Map(parentState ? parentState.values : null);
  const depends: ShapeDepends = new Map();
  const listeners: ShapeListeners = new Map();
  const events: ShapeEvents = new Map();
  const payloads: ShapePayloads = new Map();
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
        Object.assign(
          data,
          elements.get(childInstance.element)?.serialize?.(getValue) ?? {},
        );
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

    const instances = roots.flatMap((instance) =>
      [instance].concat(instance.allChidlren),
    ); // TODO Potential place for optimization
    const dependListeners: EventListener<unknown>[] = [];
    const outsideListeners: EventListener<unknown>[] = [];

    Array.from(events.get(event) ?? []).forEach((listener) => {
      const instance = listeners.get(listener);

      if (instance) {
        dependListeners[instances.indexOf(instance)] = listener;
      } else {
        outsideListeners.push(listener);
      }
    });

    for (const listener of dependListeners) {
      if (events.get(event)?.has(listener)) listener(value, prev);
    }

    for (const listener of outsideListeners) {
      if (events.get(event)?.has(listener)) listener(value, prev);
    }

    calledEvent = prevCalledEvent;
  }) as ShapeCallEvent;
  const attach: ShapeAttach = (element) => {
    const methods = elements.get(element);

    if (!methods) throw new Error("Incorrect element for attach to shape.");

    const rootInstance = methods.attach({
      getRawValue,
      deleteRawValue,
      getValue,
      setValue,
      changeValue,
      getEventState,
      isCalledEvent,
      callEvent,
    });

    roots.push(rootInstance);

    const createListen =
      (instance: ComponentInstance) =>
      <Value>(filter: DependFilter<Value>, event: Event<Value>): void => {
        const listener: EventListener<Value> = (value, prev) => {
          // filter
          if (filter === false) return;
          if (filter && filter(value, prev) === false) return;

          const prevAllChidlren = new Set(instance.allChidlren);

          // unlink
          unlinkInstance(instance);
          prevAllChidlren.forEach((childInstance) => {
            unlinkInstance(childInstance);
          });

          // reattach
          elements.get(instance.element)?.reattach(instance, {
            getRawValue,
            deleteRawValue,
            getValue,
            setValue,
            changeValue,
            getEventState,
            isCalledEvent,
            callEvent,
          });

          const currAllChildren = new Set(instance.allChidlren);

          // link
          instance.depends.forEach(createListen(instance));
          currAllChildren.forEach((childInstance) => {
            childInstance.depends.forEach(createListen(childInstance));
          });

          // detach effect
          prevAllChidlren.forEach((childInstance) => {
            if (!currAllChildren.has(childInstance)) {
              childInstance.detachEffects.forEach((effect) => effect());
            }
          });

          // attach effect
          currAllChildren.forEach((childInstance) => {
            if (!prevAllChidlren.has(childInstance)) {
              childInstance.attachEffects.forEach((effect) => effect());
            }
          });
        };

        linkInstance(instance, event, listener);
      };

    // link
    rootInstance.depends.forEach(createListen(rootInstance));
    rootInstance.allChidlren.forEach((childInstance) => {
      childInstance.depends.forEach(createListen(childInstance));
    });

    // attach effect
    rootInstance.attachEffects.forEach((effect) => effect());
    rootInstance.allChidlren.forEach((childInstance) => {
      childInstance.attachEffects.forEach((effect) => effect());
    });
  };
  const wait: ShapeWait = async () => {
    await Promise.allSettled(
      roots.flatMap((rootInstance) => [
        ...Array.from(rootInstance.promises),
        ...rootInstance.allChidlren.flatMap((child) =>
          Array.from(child.promises),
        ),
      ]),
    );
  };

  // Shape
  const shape: Shape = {
    type: "shape",

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

    // Methods [Components]
    attach,
    wait,
  };

  shapes.set(shape, { values });

  return shape;
};

export type { EventListener, Shape, CreateShape };
export { shapes, createShape };
