import React, {
  PropsWithChildren,
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Shape, createShape, Event, Store } from "restarfall";

type Dispatch<Value> = (value: Value extends void ? never : Value) => void;

interface EventState<Value> {
  payload?: Value;
}

const context = createContext<Shape>(createShape());

const Provider = memo<PropsWithChildren<{ shape: Shape }>>((props) => {
  return (
    <context.Provider value={props.shape}>{props.children}</context.Provider>
  );
});

interface UseCall {
  <Value>(event: Event<Value>): Dispatch<Value>;
  (event: Event<void>): Dispatch<void>;
}

const useCall: UseCall = <Value,>(event: Event<Value>): Dispatch<Value> => {
  const shape = useContext(context);
  return useCallback(
    (value) => {
      shape.callEvent(event, value);
    },
    [shape, event],
  );
};

interface UseChange {
  <Value>(store: Store<Value>): Dispatch<Value>;
  (store: Store<void>): Dispatch<void>;
}

const useChange: UseChange = <Value,>(store: Store<Value>): Dispatch<Value> => {
  const shape = useContext(context);
  const dispatch: Dispatch<Value> = useCallback(
    (value) => {
      shape.changeValue(store, value);
    },
    [shape, store],
  );

  return dispatch;
};

interface UseEvent {
  <Value>(event: Event<Value>): [EventState<Value>, Dispatch<Value>];
  (event: Event<void>): [EventState<void>, Dispatch<void>];
}

const useEvent: UseEvent = <Value,>(
  event: Event<Value>,
): [EventState<Value>, Dispatch<Value>] => {
  const shape = useContext(context);
  const [value, setValue] = useState<EventState<Value>>(
    shape.getEventState(event),
  );
  const dispatch = useCall(event);

  useEffect(
    () => shape.listenEvent(event, () => setValue(shape.getEventState(event))),
    [shape, event],
  );

  return [value, dispatch];
};

interface UseStore {
  <Value>(store: Store<Value>): [Value, Dispatch<Value>];
  (store: Store<void>): [void, Dispatch<void>];
}

const useStore: UseStore = <Value,>(
  store: Store<Value>,
): [Value, Dispatch<Value>] => {
  const shape = useContext(context);
  const [value, setValue] = useState<Value>(shape.getValue(store));
  const dispatch = useChange(store);

  useEffect(() => shape.listenEvent(store.changed, setValue), [shape, store]);

  return [value, dispatch];
};

export type { EventState, UseCall, UseChange, UseEvent, UseStore };
export { Provider, useCall, useChange, useEvent, useStore };
