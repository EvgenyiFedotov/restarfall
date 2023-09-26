import { create, use } from "../index";

let shape = create.shape();

beforeEach(() => (shape = create.shape()));

test("check value of store", () => {
  const $count = create.store<number>(0);

  const counter = create.unit(() => {
    const setCount = use.dispatch($count);
    setCount(7);
    return null;
  });

  shape.attach(counter());

  expect(shape.getValue($count)).toBe(7);
});

test("check state of event", () => {
  const changeCount = create.event<number>();

  const counter = create.unit(() => {
    const change = use.dispatch(changeCount);
    change(2);
    return null;
  });

  shape.attach(counter());

  expect(shape.getEventState(changeCount)).toEqual({ payload: 2 });
});

test("async check value of store", async () => {
  const request = () => {
    return new Promise<number>((resolve) => setTimeout(() => resolve(3), 200));
  };

  const $count = create.store<number>(0);

  const counter = create.unit(() => {
    const setCount = use.dispatch($count);

    use.promise(request()).then(setCount);

    return null;
  });

  shape.attach(counter());
  await shape.wait();

  expect(shape.getValue($count)).toBe(3);
});
