import { Scope } from "./scope";
import { Node, getCurrentNode } from "./tree";
import { Shape } from "./shape";

interface Context {
  shape: Shape;
  scope?: Scope;
}

const contextStack: Context[] = [];

const getContext = (): Context | undefined => {
  return contextStack[contextStack.length - 1];
};

const getShape = (): Shape | undefined => {
  return getContext()?.shape;
};

const getScope = (): Scope | undefined => {
  const context = getContext();

  return context?.scope ?? context?.shape.scope;
};

const getShapeStrict = (): Shape => {
  const shape = getShape();

  if (shape) return shape;

  throw new Error("Shape is incorrect.");
};

const getScopeStrict = (): Scope => {
  const scope = getScope();

  if (scope) return scope;

  throw new Error("Scope is incorrect.");
};

const getCurrentNodeStrict = (): Node => {
  const node = getCurrentNode(getShapeStrict().tree);

  if (node) return node;

  throw new Error("Current node is incorrect.");
};

export {
  contextStack,
  getShape,
  getScope,
  getShapeStrict,
  getScopeStrict,
  getCurrentNodeStrict,
};
