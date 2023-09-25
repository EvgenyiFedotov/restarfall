import { createBox, createCache } from "../cache";

test("box", () => {
  const box = createBox();
  const obj = {};

  expect(box.get([])).toBe("");
  expect(box.get([1, obj])).toBe("0_1");
  expect(box.get([obj, [2, obj], 1])).toBe("1_2_1_0");
  expect(box.get([obj, [[2, obj]], 1])).toBe("1_3_0");
});

test("cache", () => {
  const cache = createCache();
  const obj = {};

  expect(cache.get([obj])).toEqual({});
  expect(cache.set([obj], "123")).toEqual("123");
  expect(cache.get([obj])).toEqual({ value: "123" });
  expect(cache.get([{}])).toEqual({});
  expect(cache.take([obj], () => "456")).toEqual("123");
  expect(cache.take([obj, obj], () => "456")).toEqual("456");
  expect(cache.get([obj, [obj]])).toEqual({ value: "456" });
});
