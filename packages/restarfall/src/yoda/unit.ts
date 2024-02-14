import { Body, Unit } from "./types";
import { createElement } from "./element";

const units: WeakSet<Unit<unknown[]>> = new WeakSet();

const createUnit = <A extends unknown[]>(body: Body<A>): Unit<A> => {
  const unit: Unit<A> = (...args) => createElement(body, args);

  unit.type = "unit";
  units.add(unit as never);

  return unit;
};

const isUnit = <A extends unknown[]>(value: unknown): value is Unit<A> => {
  return units.has(value as never);
};

export { createUnit, isUnit };
