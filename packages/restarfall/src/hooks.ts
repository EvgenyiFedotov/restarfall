import { Event } from "./event";
import { Store } from "./store";
import { ComponentInstance, DependFilter, stackInstances } from "./component";

const getLastInstance = (): ComponentInstance | null => {
  return stackInstances[stackInstances.length - 1] ?? null;
};

const getInstance = (): ComponentInstance => {
  const instance = getLastInstance();

  if (!instance) throw new Error("Hook use outside component");

  return instance;
};

interface CalledEventState<Value> {
  called: boolean;
  payload?: Value;
}

interface UseDepend {
  <Value>(
    unit: Event<Value> | Store<Value>,
    filter?: DependFilter<Value>,
  ): CalledEventState<Value>;
}

const useDepend: UseDepend = <Value>(
  unit: Event<Value> | Store<Value>,
  filter?: DependFilter<Value>,
): CalledEventState<Value> => {
  const instance = getInstance();

  let eventState: { payload?: Value } = {};
  let called = false;

  if (unit.type === "event") {
    instance.depends.set(unit, filter);
    eventState = instance.api.getEventState(unit);
    called = instance.api.isCalledEvent(unit);
  } else {
    instance.depends.set(unit.changed, filter);
    eventState = instance.api.getEventState(unit.changed);
    called = instance.api.isCalledEvent(unit.changed);
  }

  return "payload" in eventState
    ? { called, payload: eventState.payload }
    : { called };
};

interface UseDispatch {
  <Value>(unit: Event<Value> | Store<Value>): (value: Value) => void;
  (unit: Event<void> | Store<void>): () => void;
}

const useDispatch: UseDispatch = <Value>(
  unit: Event<Value> | Store<Value>,
): ((value?: Value) => void) => {
  const instance = getInstance();

  return (value) => {
    if (unit.type === "event") {
      instance.api.callEvent(unit, value);
    } else {
      instance.api.changeValue(unit, value);
    }
  };
};

interface UseValue {
  <Value>(store: Store<Value>, bindDepend?: boolean): Value;
}

const useValue: UseValue = (store, bindDepend = false) => {
  const instance = getInstance();

  if (bindDepend) useDepend(store);

  return instance.api.getValue(store);
};

interface UseTake {
  <Value>(store: Store<Value>): () => Value;
}

const useTake: UseTake = (store) => {
  const instance = getInstance();

  return () => instance.api.getValue(store);
};

interface UsePromise {
  <Value>(promise: Promise<Value>): Promise<Value>;
}

const usePromise: UsePromise = (promise) => {
  const instance = getInstance();

  instance.promises.add(promise);

  return promise;
};

interface CacheApi<Value> {
  get(): { value?: Value };
  set(value: Value): Value;
  take(create: () => Value): Value;
}

interface UseCache {
  <Value>(store: Store<Value>, ...keys: unknown[]): CacheApi<Value>;
}

const useCache: UseCache = <Value>(
  store: Store<Value>,
  ...keys: unknown[]
): CacheApi<Value> => {
  const { cache } = getInstance();

  return {
    get: () => cache.get([store, keys]),
    set: (value) => cache.set([store, keys], value),
    take: (create) => cache.take([store, keys], create),
  };
};

interface UseDetach {
  (callback: () => void): void;
}

const useDetach: UseDetach = (callback) => {
  const instance = getInstance();

  instance.detachEffects.add(callback);
};

interface UseAttach {
  (callback: () => void): void;
}

const useAttach: UseAttach = (callback) => {
  const instance = getInstance();

  instance.attachEffects.add(callback);
};

export type {
  UseDepend,
  UseDispatch,
  UseValue,
  UseTake,
  UsePromise,
  UseCache,
  UseDetach,
  UseAttach,
};
export {
  useDepend,
  useDispatch,
  useValue,
  useTake,
  usePromise,
  useCache,
  useDetach,
  useAttach,
};
