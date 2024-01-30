import { createEvent } from "../event";

describe("createEvent", () => {
  test("instance", () => {
    const event = createEvent();

    expect(event).toEqual({ type: "event" });
  });
});
