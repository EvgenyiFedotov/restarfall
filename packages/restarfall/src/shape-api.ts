import { Shape, ShapeState, shapes, EventListener } from "./shape-next";
import { Store } from "./store";
import { Event } from "./event";
import { ComponentElement } from "./component";

// Utils
const getShapeState = (shape: Shape): ShapeState => {
  const state = shapes.get(shape);

  if (!state) throw new Error("Shape is incorrect");

  return state;
};

// Data
const setRawData = (shape: Shape, rawData: object): void => {
  getShapeState(shape).setRawData(rawData);
};
const serialize = (shape: Shape): object => {
  return getShapeState(shape).serialize();
};

// Values
const hasValue = <Value>(shape: Shape, store: Store<Value>): boolean => {
  return getShapeState(shape).hasValue(store);
};
const getValue = <Value>(shape: Shape, store: Store<Value>): Value => {
  return getShapeState(shape).getValue(store);
};
const setValue = <Value>(
  shape: Shape,
  store: Store<Value>,
  value: Value,
): void => {
  getShapeState(shape).setValue(store, value);
};
const changeValue = <Value>(
  shape: Shape,
  store: Store<Value>,
  value: Value,
): void => {
  getShapeState(shape).changeValue(store, value);
};

// Events
function getEventState<Value>(
  shape: Shape,
  event: Event<Value>,
): { payload?: Value };
function getEventState(shape: Shape, event: Event<void>): { payload?: void };
function getEventState<Value>(
  shape: Shape,
  event: Event<Value>,
): { payload?: Value } {
  return getShapeState(shape).getEventState(event);
}

function unlistenEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  listener: EventListener<Value>,
): void;
function unlistenEvent(
  shape: Shape,
  event: Event<void>,
  listener: EventListener<void>,
): void;
function unlistenEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  listener: EventListener<Value>,
): void {
  getShapeState(shape).unlistenEvent(event, listener);
}

function listenEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  listener: EventListener<Value>,
): () => void;
function listenEvent(
  shape: Shape,
  event: Event<void>,
  listener: EventListener<void>,
): () => void;
function listenEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  listener: EventListener<Value>,
): () => void {
  return getShapeState(shape).listenEvent(event, listener);
}

function callEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  value: Value,
): (value: Value) => void;
function callEvent(shape: Shape, event: Event<void>): () => void;
function callEvent<Value>(
  shape: Shape,
  event: Event<Value>,
  value?: Value,
): (value: Value) => void {
  getShapeState(shape).callEvent(event, value);
  return () => {};
}

// Components
const attach = (shape: Shape, element: ComponentElement): void => {
  getShapeState(shape).attach(element);
};
const wait = async (shape: Shape): Promise<void> => {
  await getShapeState(shape).wait();
};

// Api
const shapeApi = {
  setRawData,
  serialize,
  hasValue,
  getValue,
  setValue,
  changeValue,
  getEventState,
  unlistenEvent,
  listenEvent,
  callEvent,
  attach,
  wait,
};

export {
  setRawData,
  serialize,
  hasValue,
  getValue,
  setValue,
  changeValue,
  getEventState,
  unlistenEvent,
  listenEvent,
  callEvent,
  attach,
  wait,
  shapeApi,
};
