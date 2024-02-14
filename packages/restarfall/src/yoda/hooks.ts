import { isEvent } from "./event";
import { getContextStrict, root } from "./root";
import { getEventMeta, getPayload, getValue } from "./scope";
import { callEvent, changeStore, getScopeShape } from "./shape";
import { getStoreState } from "./store";
import { getCurrentNodeStrict } from "./tree";
import { Event, EventMeta, Frame, Store } from "./types";

type DependFilter<T> =
  | ((payload: Frame<T>) => boolean)
  | undefined
  | null
  | boolean;

interface UseDispatch {
  <P>(event: Event<P>): (payload: P) => void;
  (event: Event<void>): () => void;
  <V>(store: Store<V>): (value: V, force?: boolean) => void;
}

interface UsePayload {
  <P>(event: Event<P>): EventMeta<P>;
  (event: Event<void>): EventMeta<void>;
}

interface UseEvent {
  <P>(
    event: Event<P>,
    filter?: DependFilter<P>,
  ): [EventMeta<P>, (payload: P) => void];
  (
    event: Event<void>,
    filter?: DependFilter<void>,
  ): [EventMeta<void>, () => void];
}

const useDepend = <T>(
  key: Event<T> | Store<T>,
  filter?: DependFilter<T>,
): EventMeta<T> => {
  const context = getContextStrict();
  const node = getCurrentNodeStrict(context.tree);
  const scope = context.nodeScope ?? context.scope;
  const event = isEvent(key) ? key : getStoreState(key).changed;

  node.depends.push({
    event,
    filter: () => {
      if (!scope.currentEvent) return false;
      if (typeof filter === "function") return filter(getPayload(scope, event));
      if (typeof filter === "boolean") return filter;

      return true;
    },
  });

  return getEventMeta(scope, event);
};

const usePayload: UsePayload = (<P>(event: Event<P>) => {
  const context = getContextStrict();
  const scope = context.nodeScope ?? context.scope;

  return getEventMeta(scope, event);
}) as UsePayload;

const useValue = <Value>(store: Store<Value>): Value => {
  const frame = getValue(getContextStrict().scope, store);

  return "value" in frame ? (frame.value as Value) : getStoreState(store).value;
};

const useTake = <Value>(store: Store<Value>): (() => Value) => {
  const { scope } = getContextStrict();

  return () => {
    const frame = getValue(scope, store);

    return "value" in frame
      ? (frame.value as Value)
      : getStoreState(store).value;
  };
};

const useDispatch: UseDispatch = (<T>(key: Event<T> | Store<T>) => {
  const shape = getScopeShape(getContextStrict().scope);

  return (value: T, force = false): void => {
    if (isEvent(key)) {
      callEvent(shape, key, value);
    } else {
      changeStore(shape, key, value, force);
    }
  };
}) as UseDispatch;

const usePromise = <Value>(promise: Promise<Value>): Promise<Value> => {
  getContextStrict().scope.promises.add(promise);

  return promise;
};

const useScope = <Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  ...args: Args
): Result => {
  const { scope, tree } = getContextStrict();
  const node = getCurrentNodeStrict(tree);

  root.stack.push({ scope, tree, nodeScope: node.scope });

  const result = callback(...args);

  root.stack.pop();

  return result;
};

const useAttach = (callback: () => void): void => {
  getCurrentNodeStrict(getContextStrict().tree).effects.attached.add(callback);
};

const useDetach = (callback: () => void): void => {
  getCurrentNodeStrict(getContextStrict().tree).effects.detached.add(callback);
};

const useEvent: UseEvent = (<P>(event: Event<P>, filter?: DependFilter<P>) => {
  useDepend(event, filter);

  return [usePayload(event), useDispatch(event)];
}) as UseEvent;

const useStore = <V>(
  store: Store<V>,
  filter?: DependFilter<V>,
): [V, (value: V, force?: boolean) => void] => {
  useDepend(store, filter);

  return [useValue(store), useDispatch(store)];
};

export {
  useDepend,
  usePayload,
  useValue,
  useTake,
  useDispatch,
  usePromise,
  useScope,
  useAttach,
  useDetach,
  useEvent,
  useStore,
};
