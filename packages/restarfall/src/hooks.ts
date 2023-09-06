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

const useDepend = <Value>(
  unit: Event<Value> | Store<Value>,
  filter: DependFilter<Value> | false | null = null,
): {
  called: boolean;
  payload?: Value;
} => {
  const instance = getInstance();

  let eventState: { payload?: Value } = {};
  let called = false;

  if (unit.type === "event") {
    instance.depends.set(unit, filter);
    eventState = instance.api.getEventState(unit);
    called = instance.api.isCallEvent(unit);
  } else {
    instance.depends.set(unit.changed, filter);
    eventState = instance.api.getEventState(unit.changed);
    called = instance.api.isCallEvent(unit.changed);
  }

  return "payload" in eventState
    ? { called, payload: eventState.payload }
    : { called };
};

const useDispatch = <Value>(
  unit: Event<Value> | Store<Value>,
): ((value: Value) => void) => {
  const instance = getInstance();

  return (value) => {
    if (unit.type === "event") {
      instance.api.callEvent(unit, value);
    } else {
      instance.api.changeValue(unit, value);
    }
  };
};

const useValue = <Value>(store: Store<Value>, bindDepend = false): Value => {
  const instance = getInstance();

  if (bindDepend) useDepend(store);

  return instance.api.getValue(store);
};

const useTake = <Value>(store: Store<Value>): (() => Value) => {
  const instance = getInstance();

  return () => instance.api.getValue(store);
};

const usePromise = <Value>(promise: Promise<Value>): Promise<Value> => {
  const instance = getInstance();

  instance.promises.add(promise);

  return promise;
};

export { useDepend, useDispatch, useValue, useTake, usePromise };
