import { contextStack } from "./context";
import { Element } from "./element";
import { Event } from "./event";
import { Scope, createScope, getValue } from "./scope";
import { Store } from "./store";
import {
  Tree,
  attachNode,
  callDepend,
  createNode,
  createTree,
  getDiff,
} from "./tree";

interface Shape {
  scope: Scope;
  tree: Tree;
}

const createShape = (): Shape => {
  const shape: Shape = {
    scope: createScope(),
    tree: createTree(),
  };

  return shape;
};

const parseQueue = (shape: Shape): void => {
  if (contextStack.length > 0) return;

  for (const item of shape.scope.queue) {
    const { scope, event, payload, store } = item;

    if (store && getValue(scope, store).value === payload) continue;

    const currTree = shape.tree;

    scope.calledEvent = event;
    scope.payloads.set(event, payload);

    if (store) scope.values.set(store, payload);

    shape.tree = createTree();
    contextStack.push({ shape });
    callDepend(currTree, shape.tree, event);
    contextStack.pop();

    scope.calledEvent = null;

    const diff = getDiff(currTree, shape.tree);

    diff.detached.forEach((node) => {
      node.effects.detached.forEach((callback) => callback());
    });
    diff.attached.forEach((node) => {
      node.effects.attached.forEach((callback) => callback());
    });
  }

  shape.scope.queue = [];
};

const attachElement = (shape: Shape, element: Element): void => {
  const length = shape.tree.struct.length;

  contextStack.push({ shape });
  attachNode(shape.tree, createNode(element));
  contextStack.pop();

  for (let index = length; index < shape.tree.struct.length; index += 1) {
    shape.tree.struct[index]?.effects.attached.forEach((callback) =>
      callback(),
    );
  }

  parseQueue(shape);
};

const callEvent = <Payload>(
  shape: Shape,
  scope: Scope,
  event: Event<Payload>,
  payload: Payload,
): void => {
  shape.scope.queue.push({ scope, event, payload });
  parseQueue(shape);
};

const changeValue = <Value>(
  shape: Shape,
  scope: Scope,
  store: Store<Value>,
  payload: Value,
  force = false,
): void => {
  shape.scope.queue.push({ scope, event: store.changed, payload, store });

  if (force) scope.values.set(store, payload);

  parseQueue(shape);
};

export type { Shape };
export { createShape, attachElement, callEvent, changeValue };
