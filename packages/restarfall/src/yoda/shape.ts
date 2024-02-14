import {
  Action,
  Element,
  Event,
  RawData,
  Scope,
  Shape,
  ShapeState,
  Store,
  Tree,
} from "./types";
import { createScope, getValue } from "./scope";
import {
  attachNode,
  callDepend,
  createNode,
  createTree,
  getDiff,
} from "./tree";
import { getContext, root } from "./root";
import { getStoreMeta, getStoreState } from "./store";
import { isEvent } from "./event";

interface CallEvent {
  <P>(shape: Shape, event: Event<P>, payload: P): void;
  (shape: Shape, event: Event<void>): void;
}

const shapes: WeakMap<Shape, ShapeState> = new WeakMap();

const scopes: WeakMap<Scope, Shape> = new WeakMap();

const createShape = (): Shape => {
  const shape: Shape = { type: "shape" };
  const scope = createScope();

  shapes.set(shape, { scope, tree: createTree() });
  scopes.set(scope, shape);

  return shape;
};

const isShape = (value: unknown): value is Shape => {
  return shapes.has(value as never);
};

const getShapeState = (shape: Shape): ShapeState => {
  if (shapes.has(shape)) return shapes.get(shape) as ShapeState;

  throw new Error("Shape is incorrect");
};

const getScopeShape = (scope: Scope): Shape => {
  if (scopes.has(scope)) return scopes.get(scope) as Shape;

  throw new Error("Scope is incorrect");
};

const attachAction = <T>(
  currTree: Tree,
  nextTree: Tree,
  action: Action<T>,
): void => {
  const { scope, event, payload, store } = action;

  if (store && getValue(scope, store).value === payload) return;

  root.stack.push({ tree: nextTree, scope });

  if (store) scope.values.set(store, payload);

  scope.currentEvent = event;
  scope.payloads.set(event, payload);
  callDepend(currTree, nextTree, event);
  scope.currentEvent = null;

  const diff = getDiff(currTree, nextTree);

  diff.detached.forEach((node) => {
    node.effects.detached.forEach((callback) => callback());
  });
  diff.attached.forEach((node) => {
    node.effects.attached.forEach((callback) => callback());
  });

  scope.listeners.get(event)?.forEach((listener) => listener(payload));
  root.stack.pop();
};

const attachActions = (shape: Shape, scope: Scope, tree: Tree): void => {
  if (root.stack.length > 0) return;

  let currTree = tree;
  let nextTree = tree;

  // [...scope.actions].forEach((action) => {
  //   nextTree = createTree();
  //   shapes.set(shape, { scope, tree: nextTree });
  //   attachAction(currTree, nextTree, action);
  //   currTree = nextTree;
  // });

  for (const action of scope.actions) {
    nextTree = createTree();
    shapes.set(shape, { scope, tree: nextTree });
    attachAction(currTree, nextTree, action);
    currTree = nextTree;
  }

  scope.actions = [];
};

const attachElement = (shape: Shape, element: Element): void => {
  const { scope, tree } = getShapeState(shape);
  const length = tree.struct.length;

  root.stack.push({ scope, tree });
  attachNode(tree, createNode(element));
  root.stack.pop();

  for (let index = length; index < tree.struct.length; index += 1) {
    tree.struct[index]?.effects.attached.forEach((callback) => callback());
  }

  attachActions(shape, scope, tree);
};

const callEvent: CallEvent = (<P>(
  shape: Shape,
  event: Event<P>,
  payload: P,
): void => {
  const shapeState = getShapeState(shape);
  const context = getContext();
  const scope = context?.nodeScope ?? context?.scope ?? shapeState.scope;

  shapeState.scope.actions.push({ scope, event, payload });
  // console.log(shapeState.scope.actions[shapeState.scope.actions.length - 1]);
  attachActions(shape, shapeState.scope, shapeState.tree);
}) as CallEvent;

const changeStore = <V>(
  shape: Shape,
  store: Store<V>,
  value: V,
  force = false,
): void => {
  const shapeState = getShapeState(shape);
  const context = getContext();
  const scope = context?.nodeScope ?? context?.scope ?? shapeState.scope;

  if (force) scope.values.set(store, value);

  shapeState.scope.actions.push({
    scope,
    event: getStoreState(store).changed,
    payload: value,
    store,
  });
  attachActions(shape, shapeState.scope, shapeState.tree);
};

const wait = async (shape: Shape): Promise<void> => {
  const { scope } = getShapeState(shape);
  let promises = Array.from(scope.promises);

  while (promises.length > 0) {
    await Promise.allSettled(promises);
    promises.forEach((promise) => scope.promises.delete(promise));
    promises = Array.from(scope.promises);
  }
};

const listen = <T>(
  shape: Shape,
  key: Event<T> | Store<T>,
  listener: (value: T) => void,
): (() => void) => {
  const { scope } = getShapeState(shape);
  const event = isEvent(key) ? key : getStoreState(key).changed;
  const listeners = scope.listeners.get(event) ?? new Set();

  listeners.add(listener as never);
  scope.listeners.set(event, listeners);

  return () => {
    listeners.delete(listener as never);
  };
};

const serialize = (shape: Shape): RawData => {
  const rawData: RawData = {};
  const { scope } = getShapeState(shape);

  scope.values.forEach((value, store) => {
    const meta = getStoreMeta(store);

    if (meta) rawData[meta.key] = meta.converter.serialize(value);
  });

  return rawData;
};

const setRawData = (shape: Shape, rawData: RawData): void => {
  getShapeState(shape).scope.rawData = rawData;
};

export {
  createShape,
  isShape,
  getShapeState,
  getScopeShape,
  attachAction,
  attachActions,
  attachElement,
  callEvent,
  changeStore,
  wait,
  listen,
  serialize,
  setRawData,
};
