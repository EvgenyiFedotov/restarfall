import { createEvent, getCoreEvent, isEvent } from "../event";

describe("createEvent", () => {
  test("instance", () => {
    expect(createEvent()).toEqual({ type: "event" });
  });
});

describe("getCoreEvent", () => {
  test("correct", () => {
    expect(getCoreEvent(createEvent())).toEqual({ type: "event" });
  });

  test("incorrect", () => {
    expect(() => getCoreEvent({ type: "event" })).toThrow(
      new Error("Event is incorrect"),
    );
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
