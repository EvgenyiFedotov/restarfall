// Event
interface Event<P> {
  readonly type: "event";
  readonly payload?: P; // Need for resolve types
}

// Store
interface Store<V> {
  readonly type: "store";
  readonly value?: V; // Need for resolve types
}

interface Converter<V> {
  serialize: (value: V) => unknown;
  deserialize: (value: unknown) => V;
}

type StoreKey = string;

interface StoreState<V> {
  value: V;
  changed: Event<V>;
  key?: StoreKey;
}

// Element
interface Element {
  readonly type: "element";
}

type Child = null | Element;
type Children = null | Child | Child[];

type Body<A extends unknown[]> = (...args: A) => Children;

type BodyWrapper = () => Child[];

// Unit
interface Unit<A extends unknown[]> {
  type: "unit";
  (...args: A): Element;
}

// Scope
interface Frame<Value> {
  value?: Value;
}

interface EventMeta<Payload> {
  called: boolean;
  payload: Frame<Payload>;
}

interface Action<Payload> {
  scope: Scope;
  event: Event<Payload>;
  payload: Payload;
  store?: Store<Payload>;
}

type RawData = Record<string, unknown>;

interface Scope {
  payloads: Map<Event<unknown>, unknown>;
  values: Map<Store<unknown>, unknown>;
  actions: Action<unknown>[];
  currentEvent: Event<unknown> | null;
  promises: Set<Promise<unknown>>;
  listeners: Map<Event<unknown>, Set<(value: unknown) => void>>;
  rawData: RawData;
}

// Tree
type DependFilter = (() => boolean) | undefined | null | boolean;

interface Depend {
  event: Event<unknown>;
  filter: DependFilter;
}

interface Coordinates {
  from: number;
  to: number;
  level: number;
}

interface Effects {
  attached: Set<() => void>;
  detached: Set<() => void>;
}

interface Node {
  element: Element;
  coordinates: Coordinates;
  depends: Depend[];
  effects: Effects;
  children: Map<Element, Node>;
  scope: Scope;
}

interface Tree {
  stack: Node[];
  struct: Node[];
}

// Root
interface Context {
  tree: Tree;
  scope: Scope;
  nodeScope?: Scope;
}

interface Root {
  stack: Context[];
}

// Shape
interface Shape {
  readonly type: "shape";
}

interface ShapeState {
  scope: Scope;
  tree: Tree;
}

export {
  Event,
  Store,
  Converter,
  StoreKey,
  StoreState,
  Element,
  Child,
  Children,
  Body,
  BodyWrapper,
  Unit,
  Frame,
  EventMeta,
  Action,
  RawData,
  Scope,
  Node,
  Tree,
  Context,
  Root,
  Shape,
  ShapeState,
};
