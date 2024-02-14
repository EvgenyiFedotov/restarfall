import { Element, BodyWrapper, Children, Child, Body } from "./types";

const elements: WeakMap<Element, BodyWrapper> = new WeakMap();

const toChildList = (children: Children): Child[] => {
  return children ? (Array.isArray(children) ? children : [children]) : [];
};

const createElement = <A extends unknown[]>(
  body: Body<A>,
  args: A,
): Element => {
  const element: Element = { type: "element" };

  elements.set(element, () => toChildList(body(...args)));

  return element;
};

const isElement = (value: unknown): value is Element => {
  return elements.has(value as never);
};

const getBodyWrapper = (element: Element): BodyWrapper => {
  if (elements.has(element)) return elements.get(element) as BodyWrapper;

  throw new Error("Element is incorrect");
};

export { toChildList, createElement, isElement, getBodyWrapper };
