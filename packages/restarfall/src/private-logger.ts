type Action =
  | "event-created"
  | "store-created"
  | "unit-created"
  | "shape-created"
  | "element-created"
  | "element-attached"
  | "element-re-attached";

interface PrivateEvent {
  action: Action;
  timestamp: number;
  meta: Record<string, unknown>;
}

type Listener = (event: PrivateEvent) => void;

interface PrivateLogger {
  add(event: Pick<PrivateEvent, "action" | "meta">): void;
  unlisten(listenen: Listener): void;
  listen(listenen: Listener): () => void;
}

const createPrivateLogger = (): PrivateLogger => {
  const listeners: Set<Listener> = new Set();

  const logger: PrivateLogger = {
    add: (event) => {
      listeners.forEach((listener) =>
        listener({ ...event, timestamp: Date.now() }),
      );
    },
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

export type { Action, PrivateEvent, PrivateLogger };
export { createPrivateLogger };
