import { contextStack } from "./context";
import { Element } from "./element";
import { Event } from "./event";
import { Scope, createScope } from "./scope";
import { Store } from "./store";
import { Tree, attachNode, callDepend, createNode, createTree } from "./tree";

interface CalledEvent<Value> {
  scope: Scope;
  key: Event<Value> | Store<Value>;
  value: Value;
}

interface Shape {
  scope: Scope;
  tree: Tree;
  queue: CalledEvent<unknown>[];
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
    queue: [],
  };

  return shape;
};

const dispatch: Dispatch = (<Value>(
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
}) as Dispatch;

const attachElement = (shape: Shape, element: Element): void => {
  contextStack.push({ shape });
  attachNode(shape.tree, createNode(element));
  contextStack.pop();

  shape.queue.forEach(({ scope, key, value }) => {
    dispatch(shape, scope, key, value);
  });
  shape.queue = [];
};

export type { Shape };
export { createShape, attachElement, dispatch };
