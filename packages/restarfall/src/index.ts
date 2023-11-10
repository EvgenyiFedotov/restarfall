import { createEvent, isEvent } from "./event";
import { createStore, isStore } from "./store";
import { createUnit, isUnit, isElement } from "./unit";
import { createShape, isShape } from "./shape";
import {
  useDepend,
  useDispatch,
  useValue,
  useTake,
  usePromise,
  useCache,
  useDetach,
  useAttach,
} from "./hooks";
import { createLogger } from "./public-logger";

const create = {
  event: createEvent,
  store: createStore,
  unit: createUnit,
  shape: createShape,
  logger: createLogger,
};
const is = {
  event: isEvent,
  store: isStore,
  unit: isUnit,
  element: isElement,
  shape: isShape,
};
const use = {
  depend: useDepend,
  dispatch: useDispatch,
  value: useValue,
  take: useTake,
  promise: usePromise,
  cache: useCache,
  detach: useDetach,
  attach: useAttach,
};

export { create, is, use };
export { toUnitElementArray } from "./unit";

export type { Event } from "./event";
export type { Store } from "./store";
export type { Unit, UnitElement, ChildrenElements, DependFilter } from "./unit";
export type { Shape } from "./shape";
export type { LogEvent, Logger } from "./public-logger";
