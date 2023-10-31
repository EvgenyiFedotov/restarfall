import type { Action, PrivateLogEvent } from "./private-logger";
import { privateLogger } from "./private-root";

import { Event as REvent } from "./event";
import { Store } from "./store";
import { Unit, UnitElement } from "./unit";
import { Shape } from "./shape";

interface LogEventBase<A extends Action, M extends Record<string, unknown>> {
  action: A;
  timestamp: number;
  meta: M;
}

type EventCreated = LogEventBase<"event-created", { event: REvent<unknown> }>;
type StoreCreated = LogEventBase<"store-created", { store: Store<unknown> }>;
type UnitCreated = LogEventBase<"unit-created", { unit: Unit<unknown[]> }>;
type ShapeCreated = LogEventBase<"shape-created", { shape: Shape }>;
type ElementCreated = LogEventBase<
  "element-created",
  { unit: Unit<unknown[]>; element: UnitElement }
>;
type ElementAttached = LogEventBase<
  "element-attached",
  { unit: Unit<unknown[]>; element: UnitElement; shape: Shape }
>;
type ElementReattached = LogEventBase<
  "element-re-attached",
  { unit: Unit<unknown[]>; element: UnitElement; shape: Shape }
>;

type LogEvent =
  | EventCreated
  | StoreCreated
  | UnitCreated
  | ShapeCreated
  | ElementCreated
  | ElementAttached
  | ElementReattached;

const isEvent = (logEvent: PrivateLogEvent): logEvent is LogEvent => {
  return typeof logEvent === "object";
};

type Listener = (logEvent: LogEvent) => void;

interface LoggerConfig {
  filter: (logEvent: LogEvent) => boolean;
}

interface Logger {
  getEvents(): Array<LogEvent>;
  unlisten(listenen: Listener): void;
  listen(listenen: Listener): () => void;
}

const createLogger = (config?: LoggerConfig): Logger => {
  const filter = config?.filter ?? (() => true);
  const data: LogEvent[] = [];
  const listeners: Set<Listener> = new Set();

  privateLogger.listen((logEvent) => {
    if (!isEvent(logEvent)) return;
    if (!filter(logEvent)) return;

    data.push(logEvent);
    listeners.forEach((listener) => listener(logEvent));
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

export type { LogEvent, LoggerConfig, Logger };
export { createLogger };
