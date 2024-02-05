interface Element {
  (): Child[];
}

type Child = null | Element;
type Children = null | Child | Child[];

const toChildList = (children: Children): Child[] => {
  return children ? (Array.isArray(children) ? children : [children]) : [];
};

const createElement = <Args extends unknown[]>(
  body: (...args: Args) => Children,
  args: Args,
): Element => {
  return () => toChildList(body(...args));
};

export type { Element, Children };
export { createElement };
