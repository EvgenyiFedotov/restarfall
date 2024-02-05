import {
  Element as CoreElement,
  createElement as createCoreElement,
} from "../core/element";

interface Element {
  readonly type: "element";
}

type Child = null | Element;
type Children = null | Child | Child[];

const elements: WeakMap<Element, CoreElement> = new WeakMap();

const toChildList = (children: Children): Child[] => {
  return children ? (Array.isArray(children) ? children : [children]) : [];
};

const createElement = <Args extends unknown[]>(
  body: (...args: Args) => Children,
  args: Args,
): Element => {
  const element: Element = { type: "element" };
  const coreElement = createCoreElement<Args>(
    (...args) =>
      toChildList(body(...args)).map((child) =>
        child ? getCoreElement(child) : child,
      ),
    args,
  );

  elements.set(element, coreElement);

  return element;
};

const getCoreElement = (element: Element): CoreElement => {
  if (elements.has(element)) return elements.get(element) as CoreElement;

  throw new Error("Element is incorrect");
};

const isElement = (value: unknown): value is Element => {
  return elements.has(value as never);
};

export { Element, Child, Children, createElement, getCoreElement, isElement };
