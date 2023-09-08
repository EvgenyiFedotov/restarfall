/* eslint-disable no-console */
import { createStore } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const $count = createStore<number>(-1, { key: "count" });

  console.log($count.type);
  console.log($count.key);
  console.log($count.initialValue);
  console.log($count.changed.key);

  // -> "store"
  // -> "count"
  // -> -1
  // -> count_changed

  expect(log.mock.calls).toEqual([
    ["store"],
    ["count"],
    [-1],
    ["count_changed"],
  ]);
});
