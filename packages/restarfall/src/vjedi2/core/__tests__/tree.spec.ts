import {
  attachNode,
  callDepend,
  createNode,
  createTree,
  getCurrentNode,
  getDiff,
  popNode,
  pushNode,
} from "../tree";
import { createElement } from "../element";
import { createEvent } from "../event";
import { createScope } from "../scope";

describe("createNode", () => {
  test("instance", () => {
    const element = createElement(() => [], []);
    const node = createNode(element);

    expect(node).toEqual({
      element,
      coordinates: { from: -1, to: -1, level: -1 },
      depends: [],
      effects: { attached: new Set(), detached: new Set() },
      children: new Map(),
      scope: createScope(),
    });
  });
});

describe("createTree", () => {
  test("instance", () => {
    const tree = createTree();

    expect(tree).toEqual({
      stack: [],
      struct: [],
    });
  });
});

describe("pushNode", () => {
  test("one", () => {
    const element = createElement(() => [], []);
    const node = createNode(element);
    const tree = createTree();

    pushNode(tree, node);

    expect(tree.stack).toHaveLength(1);
    expect(tree.stack[0]).toBe(node);
    expect(tree.struct).toHaveLength(1);
    expect(tree.struct[0]).toBe(node);
    expect(node.coordinates.from).toBe(0);
  });

  test("two", () => {
    const element = createElement(() => [], []);
    const node0 = createNode(element);
    const node1 = createNode(element);
    const tree = createTree();

    pushNode(tree, node0);
    pushNode(tree, node1);

    expect(node0.coordinates.from).toBe(0);
    expect(node1.coordinates.from).toBe(1);
  });
});

describe("popNode", () => {
  test("one", () => {
    const element = createElement(() => [], []);
    const node = createNode(element);
    const tree = createTree();

    pushNode(tree, node);
    popNode(tree);
    popNode(tree);

    expect(tree.stack).toHaveLength(0);
    expect(tree.struct).toHaveLength(1);
    expect(tree.struct[0]).toBe(node);
    expect(node.coordinates).toEqual({ from: 0, to: 0, level: 0 });
  });

  test("two", () => {
    const element = createElement(() => [], []);
    const node0 = createNode(element);
    const node1 = createNode(element);
    const tree = createTree();

    pushNode(tree, node0);
    pushNode(tree, node1);
    popNode(tree);
    popNode(tree);

    expect(tree.stack).toHaveLength(0);
    expect(tree.struct).toHaveLength(2);
    expect(tree.struct[0]).toBe(node0);
    expect(tree.struct[1]).toBe(node1);
    expect(node0.coordinates).toEqual({ from: 0, to: 1, level: 0 });
    expect(node1.coordinates).toEqual({ from: 1, to: 1, level: 1 });
  });
});

describe("attachNode", () => {
  test("one level", () => {
    const element = createElement(() => [], []);
    const node = createNode(element);
    const tree = createTree();

    attachNode(tree, node);

    expect(tree.stack).toHaveLength(0);
    expect(tree.struct).toHaveLength(1);
  });

  test("two level", () => {
    const child0 = createElement(() => [], []);
    const child1 = createElement(() => [], []);
    const parent = createElement(() => [child0, null, child1, null], []);
    const node = createNode(parent);
    const tree = createTree();

    attachNode(tree, node);

    expect(tree.stack).toHaveLength(0);
    expect(tree.struct).toHaveLength(3);

    expect(tree.struct[0].element).toBe(parent);
    expect(tree.struct[0].coordinates).toEqual({ from: 0, to: 2, level: 0 });
    expect(tree.struct[0].children.size).toBe(2);

    expect(tree.struct[1].element).toBe(child0);
    expect(tree.struct[1].coordinates).toEqual({ from: 1, to: 1, level: 1 });
    expect(tree.struct[1].children.size).toBe(0);

    expect(tree.struct[2].element).toBe(child1);
    expect(tree.struct[2].coordinates).toEqual({ from: 2, to: 2, level: 1 });
    expect(tree.struct[2].children.size).toBe(0);
  });

  test("double with two level", () => {
    const child0 = createElement(() => [], []);
    const child1 = createElement(() => [], []);
    const parent = createElement(() => [child0, null, child1, null], []);
    const node0 = createNode(parent);
    const node1 = createNode(parent);
    const tree = createTree();

    attachNode(tree, node0);
    attachNode(tree, node1);

    expect(tree.stack).toHaveLength(0);
    expect(tree.struct).toHaveLength(6);

    expect(tree.struct[0].element).toBe(parent);
    expect(tree.struct[0].coordinates).toEqual({ from: 0, to: 2, level: 0 });
    expect(tree.struct[0].children.size).toBe(2);

    expect(tree.struct[1].element).toBe(child0);
    expect(tree.struct[1].coordinates).toEqual({ from: 1, to: 1, level: 1 });
    expect(tree.struct[1].children.size).toBe(0);

    expect(tree.struct[2].element).toBe(child1);
    expect(tree.struct[2].coordinates).toEqual({ from: 2, to: 2, level: 1 });
    expect(tree.struct[2].children.size).toBe(0);

    expect(tree.struct[3].element).toBe(parent);
    expect(tree.struct[3].coordinates).toEqual({ from: 3, to: 5, level: 0 });
    expect(tree.struct[3].children.size).toBe(2);

    expect(tree.struct[4].element).toBe(child0);
    expect(tree.struct[4].coordinates).toEqual({ from: 4, to: 4, level: 1 });
    expect(tree.struct[4].children.size).toBe(0);

    expect(tree.struct[5].element).toBe(child1);
    expect(tree.struct[5].coordinates).toEqual({ from: 5, to: 5, level: 1 });
    expect(tree.struct[5].children.size).toBe(0);
  });
});

describe("getCurrentNode", () => {
  test("not exist", () => {
    const tree = createTree();

    expect(getCurrentNode(tree)).toBe(undefined);
  });

  test("exist", () => {
    const element = createElement(() => [], []);
    const node = createNode(element);
    const tree = createTree();

    pushNode(tree, node);

    expect(getCurrentNode(tree)).toBe(node);
  });
});

describe("callDepend", () => {
  test("one element", () => {
    const event = createEvent();
    const body = jest.fn(() => []);
    const element = createElement(body, []);
    const node = createNode(element);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    node.depends.push({ event, filter: null });
    callDepend(currTree, nextTree, event);

    expect(body.mock.calls).toHaveLength(2);
  });

  test("two element (one call)", () => {
    const event = createEvent();
    const body = jest.fn(() => []);
    const element = createElement(body, []);
    const node0 = createNode(element);
    const node1 = createNode(element);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node0);
    attachNode(currTree, node1);
    node0.depends.push({ event, filter: null });
    callDepend(currTree, nextTree, event);

    expect(body.mock.calls).toHaveLength(3);
  });

  test("with child (call parent)", () => {
    const event = createEvent();
    const currTree = createTree();
    const nextTree = createTree();
    const childBody = jest.fn(() => {
      const currNode = getCurrentNode(currTree);

      if (currNode) currNode.depends.push({ event, filter: null });

      return [];
    });
    const child0 = createElement(childBody, []);
    const child1 = createElement(childBody, []);
    const parentBody = jest.fn(() => {
      const currNode = getCurrentNode(currTree);

      if (currNode) currNode.depends.push({ event, filter: null });

      return [child0, child1];
    });
    const parent = createElement(parentBody, []);
    const node = createNode(parent);

    attachNode(currTree, node);
    callDepend(currTree, nextTree, event);

    expect(childBody.mock.calls).toHaveLength(4);
    expect(parentBody.mock.calls).toHaveLength(2);
  });

  test("two child (call children)", () => {
    const event = createEvent();
    const currTree = createTree();
    const nextTree = createTree();
    const childBody = jest.fn(() => {
      const currNode = getCurrentNode(currTree);

      if (currNode) currNode.depends.push({ event, filter: null });

      return [];
    });
    const child0 = createElement(childBody, []);
    const child1 = createElement(childBody, []);
    const parentBody = jest.fn(() => [child0, child1]);
    const parent = createElement(parentBody, []);
    const node = createNode(parent);

    attachNode(currTree, node);
    callDepend(currTree, nextTree, event);

    expect(childBody.mock.calls).toHaveLength(4);
    expect(parentBody.mock.calls).toHaveLength(1);
  });

  test("off depend by filter", () => {
    const event = createEvent();
    const body = jest.fn(() => []);
    const element = createElement(body, []);
    const node = createNode(element);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    node.depends.push({ event, filter: false });
    callDepend(currTree, nextTree, event);

    expect(body.mock.calls).toHaveLength(1);
  });

  test("with filter", () => {
    const event = createEvent();
    const body = jest.fn(() => []);
    const element = createElement(body, []);
    const node = createNode(element);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    node.depends.push({ event, filter: () => false });
    callDepend(currTree, nextTree, event);

    expect(body.mock.calls).toHaveLength(1);
  });

  test("call other event", () => {
    const event0 = createEvent();
    const event1 = createEvent();
    const body = jest.fn(() => []);
    const element = createElement(body, []);
    const node = createNode(element);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    node.depends.push({ event: event0, filter: null });
    callDepend(currTree, nextTree, event1);

    expect(body.mock.calls).toHaveLength(1);
  });

  test("for incorrect struct", () => {
    const event = createEvent();
    const currTree = createTree();
    const nextTree = createTree();

    currTree.struct.push(null as never);

    callDepend(currTree, nextTree, event);

    expect(nextTree.struct).toHaveLength(0);
  });

  test("with inc children", () => {
    let index = 0;
    const event = createEvent();
    const child = createElement(() => [], []);
    const parent = createElement(() => {
      const result = index ? [child] : [];
      const currNode = getCurrentNode(currTree);

      if (currNode) currNode.depends.push({ event, filter: null });

      index += 1;

      return result;
    }, []);
    const node = createNode(parent);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    callDepend(currTree, nextTree, event);

    expect(currTree.struct[0] === nextTree.struct[0]).toBe(true);
    expect(currTree.struct).toHaveLength(1);
    expect(nextTree.struct).toHaveLength(2);

    expect(nextTree.struct[0].element).toBe(parent);
    expect(nextTree.struct[0].coordinates).toEqual({
      from: 0,
      to: 1,
      level: 0,
    });
    expect(nextTree.struct[0].children.size).toBe(1);

    expect(nextTree.struct[1].element).toBe(child);
    expect(nextTree.struct[1].coordinates).toEqual({
      from: 1,
      to: 1,
      level: 1,
    });
    expect(nextTree.struct[1].children.size).toBe(0);
  });

  test("with dec children", () => {
    let index = 0;
    const event = createEvent();
    const child = createElement(() => [], []);
    const parent = createElement(() => {
      const result = index ? [] : [child];
      const currNode = getCurrentNode(currTree);

      if (currNode) currNode.depends.push({ event, filter: null });

      index += 1;

      return result;
    }, []);
    const node = createNode(parent);
    const currTree = createTree();
    const nextTree = createTree();

    attachNode(currTree, node);
    callDepend(currTree, nextTree, event);

    expect(currTree.struct[0] === nextTree.struct[0]).toBe(true);
    expect(currTree.struct).toHaveLength(2);
    expect(nextTree.struct).toHaveLength(1);

    expect(nextTree.struct[0].element).toBe(parent);
    expect(nextTree.struct[0].coordinates).toEqual({
      from: 0,
      to: 0,
      level: 0,
    });
    expect(nextTree.struct[0].children.size).toBe(0);
  });
});

describe("getDiff", () => {
  test("sturcture of result", () => {
    const prev = createTree();
    const next = createTree();
    const element = createElement(() => null, []);
    const prevNode = createNode(element);
    const nextNode = createNode(element);
    const commonNode = createNode(element);

    attachNode(prev, prevNode);
    attachNode(prev, commonNode);
    attachNode(next, nextNode);
    attachNode(next, commonNode);

    const diff = getDiff(prev, next);

    expect(diff.skipped).toEqual(new Set([commonNode]));
    expect(diff.attached).toEqual(new Set([prevNode]));
    expect(diff.detached).toEqual(new Set([nextNode]));
  });
});
