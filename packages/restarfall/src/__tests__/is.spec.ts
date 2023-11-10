import { create, is } from "..";

test("event", () => {
  expect(is.event(create.event())).toBe(true);
  expect(is.event({})).toBe(false);
});

test("store", () => {
  expect(is.store(create.store(null))).toBe(true);
  expect(is.store({})).toBe(false);
});

test("unit", () => {
  expect(is.unit(create.unit(() => null))).toBe(true);
  expect(is.unit({})).toBe(false);
});

test("element", () => {
  expect(is.element(create.unit(() => null)())).toBe(true);
  expect(is.element({})).toBe(false);
});

test("shape", () => {
  expect(is.shape(create.shape())).toBe(true);
  expect(is.shape({})).toBe(false);
});
