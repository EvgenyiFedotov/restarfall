import {
  ComponentApi,
  ComponentElement,
  ComponentInstance,
  DependFilter,
  elements,
} from "./component";
import { Event } from "./event";
import { Store } from "./store";

interface ShapeState {
  // Data
  rawData: Record<string, unknown>;

  // Values
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values: Map<Store<unknown>, any>;

  // Events
  depends: Map<
    ComponentInstance,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Set<{ event: Event<unknown>; listener: EventListener<any> }>
  >;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners: Map<EventListener<any>, ComponentInstance>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  events: Map<Event<unknown>, Set<EventListener<any>>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payloads: Map<Event<unknown>, any>;
  calledEvent: Event<unknown> | null;

  // Components
  componentApi: ComponentApi | null;
  roots: ComponentInstance[];
}

type EventListener<Value> = (value: Value, state: { payload?: Value }) => void;

interface ShapePrivate {
  // Data
  getRawValue: (key: string) => { value?: unknown };
  deleteRawValue: (key: string) => void;

  // Events
  linkInstance: <Value>(
    instance: ComponentInstance,
    event: Event<Value>,
    listener: EventListener<Value>,
  ) => void;
  unlinkInstance: (instance: ComponentInstance) => void;
  isCalledEvent: <Value>(event: Event<Value>) => boolean;
}

interface Shape {
  type: "shape";

  // Data
  setRawData: (rawData: object) => Shape;
  serialize: () => object;

  // Values
  hasValue: <Value>(store: Store<Value>) => boolean;
  getValue: <Value>(store: Store<Value>) => Value;
  setValue: <Value>(store: Store<Value>, value: Value) => Shape;

  // Events
  getEventState: <Value>(event: Event<Value>) => { payload?: Value };
  listenEvent: <Value>(
    event: Event<Value>,
    listener: EventListener<Value>,
  ) => () => void;
  unlistenEvent: <Value>(
    event: Event<Value>,
    listener: EventListener<Value>,
  ) => void;
  callEvent: <Value>(event: Event<Value>, value: Value) => void;

  // Components
  attach: (element: ComponentElement) => { wait: () => Promise<void> };
}

const shapes: WeakMap<Shape, { values: ShapeState["values"] }> = new WeakMap();

const createShape = (parent?: Shape): Shape => {
  const parentState = parent ? shapes.get(parent) : null;

  const state: ShapeState = {
    // Data
    rawData: {},

    // Values
    values: new Map(parentState ? parentState.values : null),

    // Events
    depends: new Map(),
    listeners: new Map(),
    events: new Map(),
    payloads: new Map(),
    calledEvent: null,

    // Components
    componentApi: null,
    roots: [],
  };

  const privateApi: ShapePrivate = {
    // Data
    getRawValue: (key) => {
      return key in state.rawData ? { value: state.rawData[key] } : {};
    },
    deleteRawValue: (key) => {
      delete state.rawData[key];
    },

    // Events
    linkInstance: (instance, event, listener) => {
      const instanceDepends = state.depends.get(instance) ?? new Set();

      instanceDepends.add({ event, listener });
      state.depends.set(instance, instanceDepends);
      state.listeners.set(listener, instance);
      shape.listenEvent(event, listener);
    },
    unlinkInstance: (instance) => {
      state.depends.get(instance)?.forEach(({ event, listener }) => {
        state.listeners.delete(listener);
        shape.unlistenEvent(event, listener);
      });
      state.depends.delete(instance);
    },
    isCalledEvent: (event) => {
      return state.calledEvent === event;
    },
  };

  const shape: Shape = {
    type: "shape",

    // Data
    setRawData: (rawData) => {
      Object.assign(state.rawData, rawData);
      return shape;
    },
    serialize: () => {
      const data: object = {};

      state.roots.forEach((instance) => {
        Object.assign(
          data,
          elements.get(instance.element)?.serialize?.(shape.getValue) ?? {},
        );

        instance.allChidlren.forEach((childInstance) => {
          Object.assign(
            data,
            elements.get(childInstance.element)?.serialize?.(shape.getValue) ??
              {},
          );
        });
      });

      return data;
    },

    // Values
    hasValue: (store) => {
      return state.values.has(store);
    },
    getValue: (store) => {
      return state.values.has(store)
        ? state.values.get(store)
        : store.initialValue;
    },
    setValue: (store, value) => {
      state.values.set(store, value);

      return shape;
    },

    // Events
    getEventState: (event) => {
      return state.payloads.has(event)
        ? { payload: state.payloads.get(event) }
        : {};
    },
    listenEvent: (event, listener) => {
      const eventListeners = state.events.get(event) ?? new Set();

      eventListeners.add(listener);
      state.events.set(event, eventListeners);

      return () => {
        shape.unlistenEvent(event, listener);
      };
    },
    unlistenEvent: (event, listener) => {
      state.events.get(event)?.delete(listener);
    },
    callEvent: (event, value) => {
      const prev = shape.getEventState(event);
      const prevCalledEvent = state.calledEvent;

      state.calledEvent = event;
      state.payloads.set(event, value);

      const instances = state.roots.flatMap((instance) =>
        [instance].concat(instance.allChidlren),
      ); // TODO Potential place for optimization
      const dependListeners: EventListener<unknown>[] = [];
      const outsideListeners: EventListener<unknown>[] = [];

      Array.from(state.events.get(event) ?? []).forEach((listener) => {
        const instance = state.listeners.get(listener);

        if (instance) {
          dependListeners[instances.indexOf(instance)] = listener;
        } else {
          outsideListeners.push(listener);
        }
      });

      for (const listener of dependListeners) {
        if (state.events.get(event)?.has(listener)) listener(value, prev);
      }

      for (const listener of outsideListeners) {
        if (state.events.get(event)?.has(listener)) listener(value, prev);
      }

      state.calledEvent = prevCalledEvent;
    },

    // Components
    attach: (element) => {
      const methods = elements.get(element);

      if (!methods) throw new Error("Incorrect element for attach to shape.");

      state.componentApi = state.componentApi ?? {
        getRawValue: privateApi.getRawValue,
        deleteRawValue: privateApi.deleteRawValue,
        getValue: shape.getValue,
        setValue: shape.setValue,
        getEventState: shape.getEventState,
        isCallEvent: privateApi.isCalledEvent,
        callEvent: shape.callEvent,
      };

      const componentApi = state.componentApi;
      const rootInstance = methods.attach(state.componentApi);

      state.roots.push(rootInstance);

      const createListen =
        (instance: ComponentInstance) =>
        <Value>(
          filter: DependFilter<Value> | null | false,
          event: Event<Value>,
        ): void => {
          const listener: EventListener<Value> = (value, prev) => {
            // filter
            if (filter === false) return;
            if (filter && filter(value, prev) === false) return;

            // unlink
            privateApi.unlinkInstance(instance);
            instance.allChidlren.forEach((childInstance) => {
              privateApi.unlinkInstance(childInstance);
            });

            // reattach
            elements.get(instance.element)?.reattach(instance, componentApi);

            // link
            instance.depends.forEach(createListen(instance));
            instance.allChidlren.forEach((childInstance) => {
              childInstance.depends.forEach(createListen(childInstance));
            });
          };

          privateApi.linkInstance(instance, event, listener);
        };

      // link
      rootInstance.depends.forEach(createListen(rootInstance));
      rootInstance.allChidlren.forEach((childInstance) => {
        childInstance.depends.forEach(createListen(childInstance));
      });

      return {
        wait: async () => {
          await Promise.allSettled([
            ...Array.from(rootInstance.promises),
            ...rootInstance.allChidlren.flatMap((child) =>
              Array.from(child.promises).flat(),
            ),
          ]);
        },
      };
    },
  };

  shapes.set(shape, { values: state.values });

  return shape;
};

export { createShape };
export type { Shape };
