/* eslint-disable no-console */
import { create } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("default", () => {
  const shape = create.shape();

  console.log(shape.type);

  // -> shape

  expect(log.mock.calls).toEqual([["shape"]]);
});

test("setRawData", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);
  const unit = create.unit(() => null, {
    deserialize: (getValue) => ({
      count: { store: $count, value: getValue("count").value },
    }),
  });

  shape.setRawData({ count: 2 });
  shape.attach(unit());

  console.log(shape.hasValue($count));
  console.log(shape.getValue($count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("serialize", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);
  const $token = create.store("empty");
  const child = create.unit(() => null, {
    serialize: (getValue) => ({
      count_child: getValue($count),
      token: getValue($token),
    }),
  });
  const unit = create.unit(() => child(), {
    serialize: (getValue) => ({ count: getValue($count) }),
  });

  shape.setValue($count, 2);
  shape.attach(unit());

  console.log(shape.serialize());

  // -> { count: 2, count_child: 2, token: "empty" }

  expect(log.mock.calls).toEqual([
    [{ count: 2, count_child: 2, token: "empty" }],
  ]);
});

test("getValue / hasValue before change", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);

  console.log(shape.hasValue($count));
  console.log(shape.getValue($count));

  // -> false
  // -> -1

  expect(log.mock.calls).toEqual([[false], [-1]]);
});

test("setValue / getValue / hasValue", () => {
  const shape = create.shape();
  const $count = create.store<number>(0);

  shape.setValue($count, 2);

  console.log(shape.hasValue($count));
  console.log(shape.getValue($count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("changeValue", () => {
  const shape = create.shape();
  const $count = create.store<number>(0);

  shape.changeValue($count, 2);
  shape.changeValue($count, 2);

  console.log(shape.hasValue($count));
  console.log(shape.getValue($count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("with parent shape", () => {
  const parent = create.shape();
  const $count = create.store<number>(0);

  parent.setValue($count, 2);

  const shape = create.shape({ parent });

  console.log(shape.hasValue($count));
  console.log(shape.getValue($count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("getEventState before call event", () => {
  const event = create.event<number>();
  const shape = create.shape();

  console.log(shape.getEventState(event));

  // -> {}

  expect(log.mock.calls).toEqual([[{}]]);
});

test("getEventState / listenEvent / unlistenEvent / callEvent", () => {
  const event = create.event<number>();
  const shape = create.shape();

  const unlisten = shape.listenEvent(event, () => {
    console.log("first");
  });

  unlisten();
  shape.listenEvent(event, console.log);
  shape.callEvent(event, 1);
  shape.callEvent(event, 2);

  console.log(shape.getEventState(event));

  // -> 1 {}
  // -> 2 { payload: 1 }

  expect(log.mock.calls).toEqual([
    [1, {}],
    [2, { payload: 1 }],
    [{ payload: 2 }],
  ]);
});

test("callEvent void / with arg", () => {
  const eventVoid = create.event<void>();
  const eventNum = create.event<number>();
  const shape = create.shape();

  shape.listenEvent(eventVoid, console.log);
  shape.listenEvent(eventNum, console.log);
  shape.callEvent(eventVoid);
  shape.callEvent(eventNum, 2);

  // -> undefined {}
  // -> 2 {}

  expect(log.mock.calls).toEqual([
    [undefined, {}],
    [2, {}],
  ]);
});

test("attach", () => {
  const left = create.unit(() => {
    console.log("left");
    return null;
  });
  const right = create.unit(() => {
    console.log("right");
    return null;
  });
  const shape = create.shape();

  shape.attach(left());
  shape.attach(right());

  // -> left
  // -> right

  expect(log.mock.calls).toEqual([["left"], ["right"]]);
});

test("attach incorrect element", () => {
  const shape = create.shape();

  try {
    shape.attach({ type: "unit-element", key: "" });
  } catch {
    console.log("error");
  }

  // -> error

  expect(log.mock.calls).toEqual([["error"]]);
});

test("wait", async () => {
  const shape = create.shape();

  shape.wait().then(() => console.log("done"));

  // -> done

  await shape.wait();
  expect(log.mock.calls).toEqual([["done"]]);
});
