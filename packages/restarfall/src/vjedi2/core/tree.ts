import { Element } from "./element";
import { Event } from "./event";
import { Scope, createScope } from "./scope";

type DependFilter = (() => boolean) | undefined | null | boolean;

interface Depend {
  event: Event<unknown>;
  filter: DependFilter;
}

interface Node {
  element: Element;
  coordinates: {
    from: number;
    to: number;
    level: number;
  };
  depends: Depend[];
  children: Map<Element, Node>;
  scope: Scope;
}

interface Tree {
  stack: Node[];
  struct: Node[];
}

const createNode = (element: Element): Node => ({
  element,
  coordinates: { from: -1, to: -1, level: -1 },
  depends: [],
  children: new Map(),
  scope: createScope(),
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

  node.depends = [];
  node.children = new Map();

  pushNode(tree, node);

  new Set(node.element()).forEach((child) => {
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

const callDepend = <Payload>(
  currTree: Tree,
  nextTree: Tree,
  event: Event<Payload>,
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
      nextNode.coordinates.level - currNode.coordinates.level <= 0
    ) {
      while (nextTree.stack.length > 0) {
        const node = popNode(nextTree);

        if (!node) break;

        if (nextNode.coordinates.level - node.coordinates.level >= 0) break;
      }
    }
  }
};

export type { Node, Tree };
export {
  createNode,
  createTree,
  pushNode,
  popNode,
  attachNode,
  getCurrentNode,
  callDepend,
};
