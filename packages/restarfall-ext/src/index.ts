import { bindEvent } from "./units/bind-event";
import { combineEvents } from "./units/combine-events";
import { linkEvent } from "./units/link-event";

const units = { bindEvent, combineEvents, linkEvent };

export { units };
export type { BindEvent } from "./units/bind-event";
export type { CombineEvents } from "./units/combine-events";
export type { LinkEvent } from "./units/link-event";
