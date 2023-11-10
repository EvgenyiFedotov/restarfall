import { Event } from "./event";
import { Store } from "./store";
import { UnitContext, DependFilter, currentUnitContext } from "./unit";

const getCurrentUnitContext = (): UnitContext => {
  if (!currentUnitContext) throw new Error("Hook use outside unit");

  return currentUnitContext;
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
  const context = getCurrentUnitContext();

  let eventState: { payload?: Value } = {};
  let called = false;

  if (unit.type === "event") {
    context.instance.depends.set(unit, filter);
    eventState = context.shapeApi.getEventState(unit);
    called = context.shapeApi.isCalledEvent(unit);
  } else {
    context.instance.depends.set(unit.changed, filter);
    eventState = context.shapeApi.getEventState(unit.changed);
    called = context.shapeApi.isCalledEvent(unit.changed);
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
  const context = getCurrentUnitContext();

  return (value) => {
    if (unit.type === "event") {
      context.shapeApi.callEvent(unit, value);
    } else {
      context.shapeApi.changeValue(unit, value);
    }
  };
};

interface UseValue {
  <Value>(store: Store<Value>): Value;
}

const useValue: UseValue = (store) => {
  const context = getCurrentUnitContext();
  return context.shapeApi.getValue(store);
};

interface UseTake {
  <Value>(store: Store<Value>): () => Value;
}

const useTake: UseTake = (store) => {
  const context = getCurrentUnitContext();

  return () => context.shapeApi.getValue(store);
};

interface UsePromise {
  <Value>(promise: Promise<Value>): Promise<Value>;
}

const usePromise: UsePromise = (promise) => {
  const context = getCurrentUnitContext();

  context.instance.promises.add(promise);

  return promise;
};

interface CacheApi<Value> {
  get(): { value?: Value };
  set(value: Value): Value;
  take(create: () => Value): Value;
}

interface UseCache {
  <Value>(...path: unknown[]): CacheApi<Value>;
}

const useCache: UseCache = <Value>(...path: unknown[]): CacheApi<Value> => {
  const { cache } = getCurrentUnitContext().instance;

  return {
    get: () => cache.get(path),
    set: (value) => cache.set(path, value),
    take: (create) => cache.take(path, create),
  };
};

interface UseDetach {
  (callback: () => void): void;
}

const useDetach: UseDetach = (callback) => {
  const context = getCurrentUnitContext();

  context.instance.detachEffects.add(callback);
};

interface UseAttach {
  (callback: () => void): void;
}

const useAttach: UseAttach = (callback) => {
  const context = getCurrentUnitContext();

  context.instance.attachEffects.add(callback);
};

export type {
  UseDepend,
  UseDispatch,
  UseValue,
  UseTake,
  UsePromise,
  CacheApi,
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
