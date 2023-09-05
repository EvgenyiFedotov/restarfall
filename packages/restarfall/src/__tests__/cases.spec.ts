import { createComponent } from "../component";
import { createEvent } from "../event";
import { useDepend } from "../hooks";
import { createShape } from "../shape";

test("2 children", () => {
  const event = createEvent<string>();
  const check = jest.fn();
  const child1 = createComponent(() => {
    check("child1", useDepend(event));
    return null;
  });
  const child2 = createComponent(() => {
    check("child2", useDepend(event));
    return null;
  });
  const root = createComponent(() => [child1(), child2()]);
  const shape = createShape();

  shape.attach(root());
  shape.callEvent(event, "test");

  expect(check.mock.calls).toHaveLength(4);
  expect(check.mock.calls[0]).toEqual(["child1", { called: false }]);
  expect(check.mock.calls[1]).toEqual(["child2", { called: false }]);
  expect(check.mock.calls[2]).toEqual([
    "child1",
    { called: true, payload: "test" },
  ]);
  expect(check.mock.calls[3]).toEqual([
    "child2",
    { called: true, payload: "test" },
  ]);
});

test("last child", () => {
  const event1 = createEvent<string>();
  const event2 = createEvent<string>();
  const check = jest.fn();
  const child1 = createComponent(() => {
    check("child1", useDepend(event1));
    return null;
  });
  const child2 = createComponent(() => {
    check("child2", useDepend(event2));
    return null;
  });
  const root = createComponent(() => [child1(), child2()]);
  const shape = createShape();

  shape.attach(root());
  shape.callEvent(event2, "test");

  expect(check.mock.calls).toHaveLength(3);
  expect(check.mock.calls[0]).toEqual(["child1", { called: false }]);
  expect(check.mock.calls[1]).toEqual(["child2", { called: false }]);
  expect(check.mock.calls[2]).toEqual([
    "child2",
    { called: true, payload: "test" },
  ]);
});

test("4 children on 2 level", () => {
  const event1 = createEvent<string>();
  const event2 = createEvent<void>();
  const check = jest.fn();
  const child11 = createComponent(() => {
    check("child11", useDepend(event1, false));
    return null;
  });
  const child12 = createComponent(() => {
    check("child12", useDepend(event1));
    return null;
  });
  const child21 = createComponent(() => {
    check("child21", useDepend(event1));
    return null;
  });
  const child22 = createComponent(() => {
    check("child22", useDepend(event2));
    return null;
  });
  const child1 = createComponent(() => [child11(), child12()]);
  const child2 = createComponent(() => [child21(), child22()]);
  const root = createComponent(() => [child1(), child2()]);
  const shape = createShape();

  shape.attach(root());
  shape.callEvent(event2, undefined);
  shape.callEvent(event1, "test");

  expect(check.mock.calls).toHaveLength(7);
  expect(check.mock.calls[0]).toEqual(["child11", { called: false }]);
  expect(check.mock.calls[1]).toEqual(["child12", { called: false }]);
  expect(check.mock.calls[2]).toEqual(["child21", { called: false }]);
  expect(check.mock.calls[3]).toEqual(["child22", { called: false }]);
  expect(check.mock.calls[4]).toEqual([
    "child22",
    { called: true, payload: undefined },
  ]);
  expect(check.mock.calls[5]).toEqual([
    "child12",
    { called: true, payload: "test" },
  ]);
  expect(check.mock.calls[6]).toEqual([
    "child21",
    { called: true, payload: "test" },
  ]);
});

test("order listener by two attach", () => {
  const event1 = createEvent<string>();
  const event2 = createEvent<string>();
  const check = jest.fn();
  const child1 = createComponent(() => {
    check("child1", useDepend(event1));
    check("child1", useDepend(event2));
    return null;
  });
  const child2 = createComponent(() => {
    check("child2", useDepend(event1));
    return null;
  });
  const shape = createShape();

  shape.attach(child1());
  shape.attach(child2());

  shape.callEvent(event2, "event2");

  shape.callEvent(event1, "event1");

  expect(check.mock.calls[0]).toEqual(["child1", { called: false }]);
  expect(check.mock.calls[1]).toEqual(["child1", { called: false }]);
  expect(check.mock.calls[2]).toEqual(["child2", { called: false }]);

  expect(check.mock.calls[3]).toEqual(["child1", { called: false }]);
  expect(check.mock.calls[4]).toEqual([
    "child1",
    { called: true, payload: "event2" },
  ]);

  expect(check.mock.calls[5]).toEqual([
    "child1",
    { called: true, payload: "event1" },
  ]);
  expect(check.mock.calls[6]).toEqual([
    "child1",
    { called: false, payload: "event2" },
  ]);
  expect(check.mock.calls[7]).toEqual([
    "child2",
    { called: true, payload: "event1" },
  ]);
});
