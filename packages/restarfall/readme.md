# Restarfall

Restarfall is a JavaScript library for creating business logic and data management.

## Usage

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);
const inc = create.event<void>();

const counter = create.component(() => {
  const incEvent = use.depend(inc);
  const count = use.value($count);
  const setCount = use.dispatch($count);

  if (incEvent.called) setCount(count + 1);

  return null;
});

const shape = create.shape();

shape.attach(counter());
```

## Documentation

### You can

#### Create `store`

Store is some kind of key to use between components and other third-party libraries.

```ts
import { create } from "restarfall";

const $count = create.store<number>(0);
```

#### Create `event`

Event is some kind of key to use between components and other third-party libraries.

```ts
import { create } from "restarfall";

const inc = create.event<void>();
```

#### Create `component`

The component is required to create the logic of storage update and react to events correctly. The order of component call execution is preserved even after dependency updates, which makes your code predictable.

```ts
import { create } from "restarfall";

const counter = create.component(() => null);
```

#### Create `component` with children components

You can use child components in the component body in various variations. Attention! Calling a child component inside a parent component does not guarantee that the body of the child component will be called.

```ts
import { create } from "restarfall";

// Without children
const setValue = create.component(() => null);

// With two children
const update = create.component(() => [setValue(), setValue()]);

// With one child
const counter = create.component(() => update());
```

#### Use `arguments` for components

You can also use arguments in the component body to fine-tune your application (reusing the component for some dependency).

```ts
import { create } from "restarfall";

const update = create.component((name: string, index: number) => null);

const counter = create.component(() => [
  update("first", 0),
  update("second", 1),
]);
```

#### Create `element` from component and use one in other components

```ts
import { create } from "restarfall";

const update = create.component((name: string, index: number) => null);

const firstUpdate = update("first", 0);
const secondUpdate = update("second", 1);

const counter = create.component(() => [
  firstUpdate,
  secondUpdate,
  update("last", 99),
]);
```

#### Create `shape`

```ts
import { create } from "restarfall";

const shape = create.shape();
```

#### Use `value` hook into component

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const count = use.value($store);
  return null;
});
```

#### Use `depend` hook into component

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);
const inc = create.event<void>();

const counter = create.component(() => {
  const countChanged = use.depend($count);
  const { called, payload } = use.depend(inc);
  return null;
});
```

#### Use `filter` for `depend` hook

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const countChangedMore2 = use.depend($count, (count) => count > 2);
  return null;
});
```

#### Lock `depend`

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const countChanged = use.depend($count, false);
  return null;
});
```

#### Use `dispatch` hook into component

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);
const inc = create.event<void>();

const counter = create.component(() => {
  const changeCount = use.dispatch($count);
  const changeByInc = use.distpach(inc);

  setTimeout(() => changeCount(2), 1000);
  setTimeout(() => changeByInc(), 2000);

  return null;
});
```

#### Use `take` hook into component

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const takeCount = use.take($count);
  const changeCount = use.dispatch($count);

  setTimeout(() => changeCount(takeCount() + 1), 1000);

  return null;
});
```

#### Use `promise` hook into component

```ts
import { create, use } from "restarfall";

const request = async () => ({ count: 2 });

const $count = create.store<number>(0);

const counter = create.component(() => {
  const changeCount = use.dispatch($count);

  use.promise(request()).then(({ count }) => changeCount(count));

  return null;
});

const shape = create.shape();

shape.attach(counter());
shape.wait().then(() => {
  // all requests done
});
```

### Examples

- [Counter](https://codesandbox.io/s/restarfall-counter-example-3qcqrf?file=/src/index.js)

- [Ticker](https://codesandbox.io/s/restarfall-ticker-example-838w3t?file=/src/index.js)

## API
