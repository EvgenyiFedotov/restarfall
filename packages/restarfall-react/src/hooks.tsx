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

type Dispatch<Value> = Value extends void ? () => void : (value: Value) => void;

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

const useCall: UseCall = (event: Event<unknown>) => {
  const shape = useContext(context);

  return useCallback(
    (value?: unknown) => {
      shape.callEvent(event, value);
    },
    [shape, event],
  );
};

interface UseChange {
  <Value>(store: Store<Value>): Dispatch<Value>;
  (store: Store<void>): Dispatch<void>;
}

const useChange: UseChange = (store: Store<unknown>) => {
  const shape = useContext(context);

  return useCallback(
    (value?: unknown) => {
      shape.changeValue(store, value);
    },
    [shape, store],
  );
};

interface UseEvent {
  <Value>(event: Event<Value>): [EventState<Value>, Dispatch<Value>];
  (event: Event<void>): [EventState<void>, Dispatch<void>];
}

const useEvent: UseEvent = <Value,>(event: Event<Value>) => {
  const shape = useContext(context);
  const [value, setValue] = useState<EventState<Value>>(
    shape.getEventState(event),
  );
  const dispatch = useCall(event);

  useEffect(
    () => shape.listenEvent(event, () => setValue(shape.getEventState(event))),
    [shape, event],
  );

  return [value, dispatch] as never;
};

interface UseStore {
  <Value>(store: Store<Value>): [Value, Dispatch<Value>];
  (store: Store<void>): [void, Dispatch<void>];
}

const useStore: UseStore = <Value,>(store: Store<Value>) => {
  const shape = useContext(context);
  const [value, setValue] = useState<Value>(shape.getValue(store));
  const dispatch = useChange(store);

  useEffect(() => shape.listenEvent(store.changed, setValue), [shape, store]);

  return [value, dispatch] as never;
};

export type { EventState, UseCall, UseChange, UseEvent, UseStore };
export { Provider, useCall, useChange, useEvent, useStore };
