import { Context, Root } from "./types";

const root: Root = {
  stack: [],
};

const getContext = (): Context | undefined => {
  return root.stack[root.stack.length - 1];
};

const getContextStrict = (): Context => {
  const context = getContext();

  if (context) return context;

  throw new Error("Context is empty.");
};

export { root, getContext, getContextStrict };
