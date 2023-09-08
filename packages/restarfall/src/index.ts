import { createEvent } from "./event";
import { createStore } from "./store";
import { createComponent } from "./component";
import { createShape } from "./shape";

const create = {
  event: createEvent,
  store: createStore,
  component: createComponent,
  shape: createShape,
};

export { create };
export { createEvent } from "./event";
export type { Event } from "./event";
export { createStore } from "./store";
export type { Store } from "./store";
export { toChildren, createComponent } from "./component";
export type {
  Component,
  ComponentElement,
  Children,
  DependFilter,
} from "./component";
export { createShape } from "./shape";
export type { Shape } from "./shape";
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
  shapeApi,
} from "./shape-api";
export {
  useDepend,
  useDispatch,
  useValue,
  useTake,
  usePromise,
  use,
} from "./hooks";
