/* eslint-disable no-console */
import { create, shapeApi } from "../../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("setRawData", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);
  const component = create.component(() => null, {
    deserialize: (getValue) => ({
      count: { store: $count, value: getValue("count").value },
    }),
  });

  shapeApi.setRawData(shape, { count: 2 });
  shapeApi.attach(shape, component());

  console.log(shapeApi.hasValue(shape, $count));
  console.log(shapeApi.getValue(shape, $count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("serialize", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);
  const component = create.component(() => null, {
    serialize: (getValue) => ({ count: getValue($count) }),
  });

  shapeApi.setValue(shape, $count, 2);
  shapeApi.attach(shape, component());

  console.log(shapeApi.serialize(shape));

  // -> { count: 2 }

  expect(log.mock.calls).toEqual([[{ count: 2 }]]);
});

test("getValue / hasValue before change", () => {
  const shape = create.shape();
  const $count = create.store<number>(-1);

  console.log(shapeApi.hasValue(shape, $count));
  console.log(shapeApi.getValue(shape, $count));

  // -> false
  // -> -1

  expect(log.mock.calls).toEqual([[false], [-1]]);
});

test("setValue / getValue / hasValue", () => {
  const shape = create.shape();
  const $count = create.store<number>(0);

  shapeApi.setValue(shape, $count, 2);

  console.log(shapeApi.hasValue(shape, $count));
  console.log(shapeApi.getValue(shape, $count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("changeValue", () => {
  const shape = create.shape();
  const $count = create.store<number>(0);

  shapeApi.changeValue(shape, $count, 2);

  console.log(shapeApi.hasValue(shape, $count));
  console.log(shapeApi.getValue(shape, $count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("with parent shape", () => {
  const rootShape = create.shape();
  const $count = create.store<number>(0);

  shapeApi.setValue(rootShape, $count, 2);

  const shape = create.shape(rootShape);

  console.log(shapeApi.hasValue(shape, $count));
  console.log(shapeApi.getValue(shape, $count));

  // -> true
  // -> 2

  expect(log.mock.calls).toEqual([[true], [2]]);
});

test("getEventState before call event", () => {
  const event = create.event<number>();
  const shape = create.shape();

  console.log(shapeApi.getEventState(shape, event));

  // -> {}

  expect(log.mock.calls).toEqual([[{}]]);
});

test("getEventState / listenEvent / unlistenEvent / callEvent", () => {
  const event = create.event<number>();
  const shape = create.shape();

  const unlisten = shapeApi.listenEvent(shape, event, () => {
    console.log("first");
  });

  unlisten();
  shapeApi.listenEvent(shape, event, console.log);
  shapeApi.callEvent(shape, event, 1);
  shapeApi.callEvent(shape, event, 2);

  console.log(shapeApi.getEventState(shape, event));

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

  shapeApi.listenEvent(shape, eventVoid, console.log);
  shapeApi.listenEvent(shape, eventNum, console.log);
  shapeApi.callEvent(shape, eventVoid);
  shapeApi.callEvent(shape, eventNum, 2);

  // -> undefined {}
  // -> 2 {}

  expect(log.mock.calls).toEqual([
    [undefined, {}],
    [2, {}],
  ]);
});

test("attach", () => {
  const left = create.component(() => {
    console.log("left");
    return null;
  });
  const right = create.component(() => {
    console.log("right");
    return null;
  });
  const shape = create.shape();

  shapeApi.attach(shape, left());
  shapeApi.attach(shape, right());

  // -> left
  // -> right

  expect(log.mock.calls).toEqual([["left"], ["right"]]);
});

test("wait", async () => {
  const shape = create.shape();

  shapeApi.wait(shape).then(() => console.log("done"));

  // -> done

  await shapeApi.wait(shape);
  expect(log.mock.calls).toEqual([["done"]]);
});
