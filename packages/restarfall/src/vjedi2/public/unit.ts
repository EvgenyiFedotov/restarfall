import { Children, Element, createElement } from "./element";

interface Unit<Args extends unknown[]> {
  type: "unit";
  (...args: Args): Element;
}

const units: WeakSet<Unit<unknown[]>> = new WeakSet();

const createUnit = <Args extends unknown[]>(
  body: (...args: Args) => Children,
): Unit<Args> => {
  const unit: Unit<Args> = (...args) => createElement(body, args);

  unit.type = "unit";

  units.add(unit as never);

  return unit;
};

const isUnit = <Args extends unknown[]>(
  value: unknown,
): value is Unit<Args> => {
  return units.has(value as never);
};

export { createUnit, isUnit };
