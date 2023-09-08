/* eslint-disable no-console */
import { createEvent } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const change = createEvent<string>({ key: "change" });

  console.log(change.type);
  console.log(change.key);

  // -> event
  // -> change

  expect(log.mock.calls).toEqual([["event"], ["change"]]);
});
