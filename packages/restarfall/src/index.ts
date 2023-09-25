import { createEvent } from "./event";
import { createStore } from "./store";
import { createComponent } from "./component";
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
  component: createComponent,
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
export { toChildrenElements, createComponent } from "./component";
export type {
  Component,
  ComponentElement,
  ChildrenElements,
  DependFilter,
} from "./component";
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
export type { CalledEventState } from "./hooks";
