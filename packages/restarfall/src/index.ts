import { createEvent } from "./event";
import { createStore } from "./store";
import { createUnit } from "./unit";
import { createShape } from "./shape";
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

const create = {
  event: createEvent,
  store: createStore,
  unit: createUnit,
  shape: createShape,
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

export { create, use };
export { createEvent } from "./event";
export type { Event } from "./event";
export { createStore } from "./store";
export type { Store } from "./store";
export { toUnitElementArray, createUnit } from "./unit";
export type { Unit, UnitElement, ChildrenElements, DependFilter } from "./unit";
export { createShape } from "./shape";
export type { Shape } from "./shape";
export {
  useDepend,
  useDispatch,
  useValue,
  useTake,
  usePromise,
  useCache,
  useDetach,
  useAttach,
} from "./hooks";
