/* eslint-disable no-console */
import { create } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const unit = create.unit(() => null);

  console.log(unit, unit.type);

  // -> function "unit"

  expect(log.mock.calls).toEqual([[unit, "unit"]]);
});
