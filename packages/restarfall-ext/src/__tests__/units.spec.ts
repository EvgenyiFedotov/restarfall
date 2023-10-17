/* eslint-disable no-console */
import { create } from "restarfall";

import { units } from "../index";

const log = jest.fn();
global.console = { ...console, log };
beforeEach(() => log.mockClear());

test("bind event", () => {
  const change = create.event<number>();

  const counter = create.unit((value: number) => {
    console.log(value);
    return null;
  });

  const shape = create.shape();

  shape.attach(units.bindEvent(change, counter));
  shape.callEvent(change, 2);

  // -> 11

  expect(log.mock.calls).toHaveLength(1);
  expect(log.mock.calls).toEqual([[2]]);
});

test("combine event without fn", () => {
  const inc = create.event<number>();
  const dec = create.event<number>();
  const changed = create.event<{ inc: number; dec: number }>();

  const shape = create.shape();

  shape.listenEvent(changed, (value) => console.log(value));
  shape.attach(units.combineEvents({ events: { inc, dec }, target: changed }));
  shape.callEvent(inc, 10);
  shape.callEvent(dec, 20);

  // -> { inc: 10 }
  // -> { dec: 20 }

  expect(log.mock.calls).toHaveLength(2);
  expect(log.mock.calls).toEqual([[{ inc: 10 }], [{ dec: 20 }]]);
});

test("combine event with fn", () => {
  const inc = create.event<number>();
  const dec = create.event<number>();
  const changed = create.event<number>();

  const shape = create.shape();

  shape.listenEvent(changed, (value) => console.log(value));
  shape.attach(
    units.combineEvents({
      events: { inc, dec },
      fn: ({ inc, dec }) => inc || dec || 0,
      target: changed,
    }),
  );
  shape.callEvent(inc, 10);
  shape.callEvent(dec, 20);

  // -> 10
  // -> 20

  expect(log.mock.calls).toHaveLength(2);
  expect(log.mock.calls).toEqual([[10], [20]]);
});

test("link event", () => {
  const inc = create.event<number>();
  const changed = create.event<number>();

  const shape = create.shape();

  shape.listenEvent(changed, (value) => console.log(value));
  shape.attach(units.linkEvent(inc, changed));
  shape.callEvent(inc, 10);

  // -> 10

  expect(log.mock.calls).toHaveLength(1);
  expect(log.mock.calls).toEqual([[10]]);
});
