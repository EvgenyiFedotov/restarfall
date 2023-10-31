import type { Action, PrivateEvent } from "./private-logger";
import { privateLogger } from "./private-root";

import { Event as REvent } from "./event";
import { Store } from "./store";
import { Unit, UnitElement } from "./unit";
import { Shape } from "./shape";

interface EventBase<A extends Action, M extends Record<string, unknown>> {
  action: A;
  timestamp: number;
  meta: M;
}

type EventCreated = EventBase<"event-created", { event: REvent<unknown> }>;
type StoreCreated = EventBase<"store-created", { store: Store<unknown> }>;
type UnitCreated = EventBase<"unit-created", { unit: Unit<unknown[]> }>;
type ShapeCreated = EventBase<"shape-created", { shape: Shape }>;
type ElementCreated = EventBase<
  "element-created",
  { unit: Unit<unknown[]>; element: UnitElement }
>;
type ElementAttached = EventBase<
  "element-attached",
  { unit: Unit<unknown[]>; element: UnitElement; shape: Shape }
>;
type ElementReattached = EventBase<
  "element-re-attached",
  { unit: Unit<unknown[]>; element: UnitElement; shape: Shape }
>;

type Event =
  | EventCreated
  | StoreCreated
  | UnitCreated
  | ShapeCreated
  | ElementCreated
  | ElementAttached
  | ElementReattached;

const isEvent = (event: PrivateEvent): event is Event => {
  return typeof event === "object";
};

type Listener = (event: Event) => void;

interface LoggerConfig {
  filter: (event: Event) => boolean;
}

interface Logger {
  getEvents(): Array<Event>;
  unlisten(listenen: Listener): void;
  listen(listenen: Listener): () => void;
}

const createLogger = (config?: LoggerConfig): Logger => {
  const filter = config?.filter ?? (() => true);
  const data: Event[] = [];
  const listeners: Set<Listener> = new Set();

  privateLogger.listen((event) => {
    if (!isEvent(event)) return;
    if (!filter(event)) return;

    data.push(event);
    listeners.forEach((listener) => listener(event));
  });

  const logger: Logger = {
    getEvents: () => [...data],
    unlisten: (listener) => {
      listeners.delete(listener);
    },
    listen: (listener) => {
      listeners.add(listener);
      return logger.unlisten.bind(null, listener);
    },
  };

  return logger;
};

export type { Event, Logger };
export { createLogger };
