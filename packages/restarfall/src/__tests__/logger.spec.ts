import { createLogger } from "../public-logger";
import { create, use } from "..";

test("event created", () => {
  const logger = createLogger();
  const event = create.event();
  const logs = logger.getEvents();

  expect(logs).toHaveLength(1);
  expect(logs[0].action).toEqual("event-created");
  expect(typeof logs[0].timestamp).toBe("number");
  expect(logs[0].meta).toEqual({ event });
});

test("store created", () => {
  const logger = createLogger();
  const store = create.store(null);
  const logs = logger.getEvents();

  expect(logs).toHaveLength(1);
  expect(logs[0].action).toEqual("store-created");
  expect(logs[0].meta).toEqual({ store });
});

test("unit created", () => {
  const logger = createLogger();
  const unit = create.unit(() => null);
  const logs = logger.getEvents();

  expect(logs).toHaveLength(1);
  expect(logs[0].action).toEqual("unit-created");
  expect(logs[0].meta).toEqual({ unit });
});

test("shape created", () => {
  const logger = createLogger();
  const shape = create.shape();
  const logs = logger.getEvents();

  expect(logs).toHaveLength(1);
  expect(logs[0].action).toEqual("shape-created");
  expect(logs[0].meta).toEqual({ shape });
});

test("event, store, unit, shape created", () => {
  const logger = createLogger();
  const event = create.event();
  const store = create.store(null);
  const unit = create.unit(() => null);
  const shape = create.shape();
  const logs = logger.getEvents();

  expect(logs).toHaveLength(4);
  expect(logs[0].meta).toEqual({ event });
  expect(logs[1].meta).toEqual({ store });
  expect(logs[2].meta).toEqual({ unit });
  expect(logs[3].meta).toEqual({ shape });
});

test("element created", () => {
  const logger = createLogger();
  const unit = create.unit(() => null);
  const element = unit();
  const logs = logger.getEvents();

  expect(logs).toHaveLength(2);
  expect(logs[1].action).toEqual("element-created");
  expect(logs[1].meta).toEqual({ unit, element });
});

test("element attach / attached", () => {
  const logger = createLogger();
  const unit = create.unit(() => null);
  const element = unit();
  const shape = create.shape();

  shape.attach(element);

  const logs = logger.getEvents();

  expect(logs).toHaveLength(5);
  expect(logs[3].action).toEqual("element-attach");
  expect(logs[3].meta).toEqual({ unit, element, shape });
  expect(logs[4].action).toEqual("element-attached");
  expect(logs[4].meta).toEqual({ unit, element, shape });
});

test("element re-attach / re-attached", () => {
  const logger = createLogger();
  const event = create.event<void>();
  const unit = create.unit(() => {
    use.depend(event);
    return null;
  });
  const element = unit();
  const shape = create.shape();

  shape.attach(element);
  shape.callEvent(event);

  const logs = logger.getEvents();

  expect(logs).toHaveLength(8);
  expect(logs[6].action).toEqual("element-re-attach");
  expect(logs[6].meta).toEqual({ unit, element, shape });
  expect(logs[7].action).toEqual("element-re-attached");
  expect(logs[7].meta).toEqual({ unit, element, shape });
});
