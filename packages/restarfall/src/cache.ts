type Path = (unknown | unknown[])[];

interface Box {
  readonly type: "box";
  get(path: Path): string;
}

const createBox = (): Box => {
  let index = -1;
  const values: Map<unknown, number> = new Map();

  const box: Box = {
    type: "box",
    get: (path) => {
      return path.flat().reduce<string>((memo, item) => {
        if (!values.has(item)) values.set(item, (index += 1));

        return memo + (memo ? "_" : "") + values.get(item);
      }, "");
    },
  };

  return box;
};

interface Cache<Value> {
  readonly type: "cache";
  get(path: Path): object | { value: Value };
  set(path: Path, value: Value): Value;
  take(path: Path, create: () => Value): Value;
}

const createCache = <Value>(): Cache<Value> => {
  const box = createBox();
  const values: Map<string, Value> = new Map();

  const cache: Cache<Value> = {
    type: "cache",
    get: (path) => {
      const id = box.get(path);

      if (values.has(id)) return { value: values.get(id) };

      return {};
    },
    set: (path, value) => {
      values.set(box.get(path), value);
      return value;
    },
    take: (path, create) => {
      const result = cache.get(path);
      return "value" in result ? result.value : cache.set(path, create());
    },
  };

  return cache;
};

export type { Box, Cache };
export { createBox, createCache };
