import { Element, Event, Node, Tree } from "./types";
import { createScope } from "./scope";
import { getBodyWrapper } from "./element";

const createNode = (element: Element): Node => ({
  element,
  coordinates: { from: -1, to: -1, level: -1 },
  depends: [],
  children: new Map(),
  scope: createScope(),
  effects: { attached: new Set(), detached: new Set() },
});

const createTree = (): Tree => ({
  stack: [],
  struct: [],
});

const pushNode = (tree: Tree, node: Node): void => {
  node.coordinates.from = tree.struct.length;
  tree.stack.push(node);
  tree.struct.push(node);
};

const popNode = (tree: Tree): Node | undefined => {
  const node = tree.stack.pop();

  if (!node) return;

  node.coordinates.to = tree.struct.length - 1;
  node.coordinates.level = tree.stack.length;

  return node;
};

const attachNode = (tree: Tree, node: Node): void => {
  const children = node.children;
  const bodyWrapper = getBodyWrapper(node.element);

  node.depends = [];
  node.children = new Map();

  pushNode(tree, node);

  new Set(bodyWrapper()).forEach((child) => {
    if (!child) return;

    const childNode = children.get(child) ?? createNode(child);

    node.children.set(child, childNode);
    attachNode(tree, childNode);
  });

  popNode(tree);
};

const getCurrentNode = (tree: Tree): Node | undefined => {
  return tree.stack[tree.stack.length - 1];
};

const getCurrentNodeStrict = (tree: Tree): Node => {
  const node = getCurrentNode(tree);

  if (node) return node;

  throw new Error("Node is empty.");
};

const callDepend = <P>(
  currTree: Tree,
  nextTree: Tree,
  event: Event<P>,
): void => {
  for (let index = 0; index < currTree.struct.length; index += 1) {
    const currNode = currTree.struct[index];
    const nextNode = currTree.struct[index + 1];

    if (!currNode) continue;

    const needReattach = currNode.depends.reduce((memo, depend) => {
      if (event !== depend.event) return memo || false;
      if (depend.filter === false) return memo || false;
      if (typeof depend.filter === "function" && depend.filter() === false) {
        return memo || false;
      }
      return memo || true;
    }, false);

    if (needReattach) {
      index = currNode.coordinates.to;
      attachNode(nextTree, currNode);
    } else {
      pushNode(nextTree, currNode);
    }

    if (
      nextNode &&
      nextNode.coordinates.level - currNode.coordinates.level < 0
    ) {
      while (nextTree.stack.length > 0) {
        const node = popNode(nextTree);

        if (!node || nextNode.coordinates.level - node.coordinates.level >= 0) {
          break;
        }
      }
    }
  }

  while (nextTree.stack.length > 0) popNode(nextTree);
};

const getDiff = (
  prev: Tree,
  next: Tree,
): { skipped: Set<Node>; attached: Set<Node>; detached: Set<Node> } => {
  const prevSet = new Set(prev.struct);
  const skipped: Set<Node> = new Set();
  const attached: Set<Node> = new Set();
  const detached: Set<Node> = new Set();

  next.struct.forEach((node) => {
    if (prevSet.has(node)) skipped.add(node);
    else attached.add(node);
  });

  prev.struct.forEach((node) => {
    if (skipped.has(node) === false) detached.add(node);
  });

  return { skipped, attached, detached };
};

export {
  createNode,
  createTree,
  pushNode,
  popNode,
  attachNode,
  getCurrentNode,
  getCurrentNodeStrict,
  callDepend,
  getDiff,
};
