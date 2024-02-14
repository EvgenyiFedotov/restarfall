import { createEvent, isEvent } from "../event";

describe("createEvent", () => {
  test("correct", () => {
    expect(createEvent()).toEqual({ type: "event" });
  });
});

describe("isEvent", () => {
  test("correct", () => {
    expect(isEvent(createEvent())).toBe(true);
  });

  test("incorrect", () => {
    expect(isEvent({ type: "event" })).toBe(false);
  });
});
