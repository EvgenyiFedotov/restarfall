/* eslint-disable no-console */
import { create } from "../../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const shape = create.shape();

  console.log(shape.type);

  // -> shape

  expect(log.mock.calls).toEqual([["shape"]]);
});
