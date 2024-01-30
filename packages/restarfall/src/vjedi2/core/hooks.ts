import { Event } from "./event";
import { Store } from "./store";
import { EventMeta, Frame, getEventMeta, getPayload, getValue } from "./scope";
import {
  contextStack,
  getCurrentNodeStrict,
  getScopeStrict,
  getShapeStrict,
} from "./context";

interface UseDispatch {
  <Value>(key: Event<Value> | Store<Value>): (value: Value) => void;
  (key: Event<void> | Store<void>): () => void;
}

const useDepend = <T>(
  key: Event<T> | Store<T>,
  filter?: ((value: Frame<T>) => boolean) | undefined | null | boolean,
): EventMeta<T> => {
  const scope = getScopeStrict();
  const node = getCurrentNodeStrict();
  const event = "changed" in key ? key.changed : key;

  node.depends.push({
    event,
    filter: () => {
      if (!scope.calledEvent) return false;
      if (typeof filter === "function") return filter(getPayload(scope, event));
      if (typeof filter === "boolean") return filter;

      return true;
    },
  });

  return getEventMeta(scope, event);
};

const useValue = <Value>(store: Store<Value>): Value => {
  const frame = getValue(getScopeStrict(), store);

  return "value" in frame ? (frame.value as Value) : store.initialValue;
};

const useTake = <Value>(store: Store<Value>): (() => Value) => {
  const scope = getScopeStrict();

  return () => {
    const frame = getValue(scope, store);

    return "value" in frame ? (frame.value as Value) : store.initialValue;
  };
};

const useDispatch: UseDispatch = (<T>(key: Event<T> | Store<T>) => {
  const shape = getShapeStrict();
  const scope = getScopeStrict();

  return (value: T): void => {
    shape.queue.push({ scope, key, value });
  };
}) as UseDispatch;

const useScope = <Args extends unknown[], Result>(
  callback: (...args: Args) => Result,
  ...args: Args
): Result => {
  const shape = getShapeStrict();
  const node = getCurrentNodeStrict();

  contextStack.push({ shape, scope: node.scope });

  const result = callback(...args);

  contextStack.pop();

  return result;
};

export { useDepend, useValue, useTake, useDispatch, useScope };
