import { createEvent } from "../event";

test("default", () => {
  expect(createEvent()).toEqual({ type: "event", key: null });
});

test("with options", () => {
  expect(createEvent({ key: "name" })).toEqual({ type: "event", key: "name" });
});
