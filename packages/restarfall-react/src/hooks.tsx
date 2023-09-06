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

const useCall = <Value,>(event: Event<Value>): Dispatch<Value> => {
  const shape = useContext(context);
  return useCallback(
    (value) => {
      shape.callEvent(event, value);
    },
    [shape, event],
  );
};

const useChange = <Value,>(store: Store<Value>): Dispatch<Value> => {
  const shape = useContext(context);
  const dispatch: Dispatch<Value> = useCallback(
    (value) => {
      const prevValue = shape.getValue(store);

      if (prevValue === value) return;

      shape.setValue(store, value);
      shape.callEvent(store.changed, value);
    },
    [shape, store],
  );

  return dispatch;
};

const useEvent = <Value,>(
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

const useStore = <Value,>(store: Store<Value>): [Value, Dispatch<Value>] => {
  const shape = useContext(context);
  const [value, setValue] = useState<Value>(shape.getValue(store));
  const dispatch = useChange(store);

  useEffect(() => shape.listenEvent(store.changed, setValue), [shape, store]);

  return [value, dispatch];
};

export { Provider, useCall, useChange, useEvent, useStore };
