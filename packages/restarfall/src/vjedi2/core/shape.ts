import { contextStack } from "./context";
import { Element } from "./element";
import { Event } from "./event";
import { Scope, createScope } from "./scope";
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

interface Dispatch {
  <Value>(
    shape: Shape,
    scope: Scope,
    key: Event<Value> | Store<Value>,
    value: Value,
  ): void;
  (shape: Shape, scope: Scope, key: Event<void> | Store<void>): void;
}

const createShape = (): Shape => {
  const shape: Shape = {
    scope: createScope(),
    tree: createTree(),
  };

  return shape;
};

const callEvent = <Value>(
  shape: Shape,
  scope: Scope,
  key: Event<Value> | Store<Value>,
  value: Value,
): void => {
  const currTree = shape.tree;
  const isStore = "changed" in key;
  const event = isStore ? key.changed : key;

  scope.calledEvent = event;
  scope.payloads.set(event, value);

  if (isStore) scope.values.set(key, value);

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
};

const callEvents = (shape: Shape): void => {
  shape.scope.queue.forEach(({ scope, key, value }) => {
    callEvent(shape, scope, key, value);
  });
  shape.scope.queue = [];
};

const dispatch: Dispatch = (<Value>(
  shape: Shape,
  scope: Scope,
  key: Event<Value> | Store<Value>,
  value: Value,
): void => {
  shape.scope.queue.push({ scope, key, value });

  if (contextStack.length > 0) return;

  callEvents(shape);
}) as Dispatch;

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

  callEvents(shape);
};

export type { Shape };
export { createShape, dispatch, attachElement };
