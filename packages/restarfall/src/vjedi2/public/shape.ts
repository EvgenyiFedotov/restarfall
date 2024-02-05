import {
  Shape as CoreShape,
  createShape as createCoreShape,
  attachElement as attachCoreElement,
  dispatch as dispatchCore,
} from "../core/shape";
import { wait as waitCore } from "../core/scope";
import { Element, getCoreElement } from "./element";

import { Event, getCoreEvent, isEvent } from "./event";
import { Store, getCoreStore } from "./store";

interface Shape {
  readonly type: "shape";
}

interface Dispatch {
  <T>(shape: Shape, event: Event<T> | Store<T>, value: T): void;
  (shape: Shape, event: Event<void>): void;
}

const shapes: WeakMap<Shape, CoreShape> = new WeakMap();

const createShape = (): Shape => {
  const shape: Shape = { type: "shape" };
  const coreShape = createCoreShape();

  shapes.set(shape, coreShape);

  return shape;
};

const getCoreShape = (shape: Shape): CoreShape => {
  if (shapes.has(shape)) return shapes.get(shape) as CoreShape;

  throw new Error("Shape is incorrect");
};

const isShape = (value: unknown): value is Shape => {
  return shapes.has(value as never);
};

const attachElement = (shape: Shape, element: Element): void => {
  attachCoreElement(getCoreShape(shape), getCoreElement(element));
};

const dispatch: Dispatch = (<T>(
  shape: Shape,
  key: Event<T> | Store<T>,
  value: T,
): void => {
  const coreShape = getCoreShape(shape);
  const coreKey = isEvent(key) ? getCoreEvent(key) : getCoreStore(key);

  dispatchCore(coreShape, coreShape.scope, coreKey, value);
}) as Dispatch;

const wait = async (shape: Shape): Promise<void> => {
  await waitCore(getCoreShape(shape).scope);
};

export {
  Shape,
  createShape,
  getCoreShape,
  isShape,
  attachElement,
  dispatch,
  wait,
};
