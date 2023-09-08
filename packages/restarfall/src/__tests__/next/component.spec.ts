/* eslint-disable no-console */
import { create } from "../../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const component = create.component(() => null);

  console.log(component);
  console.log(component.type);

  // -> function
  // -> "component"

  expect(log.mock.calls).toEqual([[component], ["component"]]);
});

test("create element", () => {
  const component = create.component(() => null, { key: "root" });
  const left = component();
  const right = component();

  console.log(left.type);
  console.log(left.key);
  console.log(left.index);
  console.log(right.type);
  console.log(right.key);
  console.log(right.index);

  // -> component-element
  // -> "root"
  // -> 1
  // -> component-element
  // -> "root"
  // -> 2

  expect(log.mock.calls).toEqual([
    ["component-element"],
    ["root"],
    [1],
    ["component-element"],
    ["root"],
    [2],
  ]);
});
