import * as coreHooks from "../core/hooks";
import { Frame, EventMeta } from "../core/scope";

import { Event, getCoreEvent, isEvent } from "./event";
import { Store, getCoreStore } from "./store";

interface UseDispatch {
  <Value>(
    key: Event<Value> | Store<Value>,
  ): (value: Value, needChange?: boolean) => void;
  (key: Event<void> | Store<void>): () => void;
}

const useDepend = <T>(
  key: Event<T> | Store<T>,
  filter?: ((payload: Frame<T>) => boolean) | undefined | null | boolean,
): EventMeta<T> => {
  const coreKey = isEvent(key) ? getCoreEvent(key) : getCoreStore(key);

  return coreHooks.useDepend(coreKey, filter);
};

const useValue = <Value>(store: Store<Value>): Value => {
  return coreHooks.useValue(getCoreStore(store));
};

const useTake = <Value>(store: Store<Value>): (() => Value) => {
  return coreHooks.useTake(getCoreStore(store));
};

const useDispatch: UseDispatch = (<T>(key: Event<T> | Store<T>) => {
  return coreHooks.useDispatch(
    isEvent(key) ? getCoreEvent(key) : getCoreStore(key),
  );
}) as UseDispatch;

const usePromise = <Value>(promise: Promise<Value>): Promise<Value> => {
  return coreHooks.usePromise(promise);
};

const useScope = <Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  ...args: Args
): Result => {
  return coreHooks.useScope(callback, ...args);
};

const useAttach = (callback: () => void): void => {
  coreHooks.useAttach(callback);
};

const useDetach = (callback: () => void): void => {
  coreHooks.useDetach(callback);
};

export {
  Frame,
  EventMeta,
  useDepend,
  useValue,
  useTake,
  useDispatch,
  usePromise,
  useScope,
  useAttach,
  useDetach,
};
