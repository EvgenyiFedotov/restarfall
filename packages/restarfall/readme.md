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

A store is some kind of key to use between components and other third-party libraries.

```ts
import { create } from "restarfall";

const $count = create.store<number>(0);
```

#### Create `event`

An event is some kind of key to use between components and other third-party libraries.

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

You can use child components in the component body in various variations.

> [!IMPORTANT]
> Calling a child component inside a parent component does not guarantee that the body of the child component will be called. To call the body of the child component, you must set it to the `return` of the parent component.

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

When a component is called, an element is created that can be used either as a child component or as a [rooted]() component.

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

A shape is a certain context relative to which the attached components will be launched. The form stores the raw data (e.g. received via ssr), storage state, data with which events were called, event listeners, and components, both root and child components, to ensure the order in which components are called.

```ts
import { create } from "restarfall";

const shape = create.shape();
```

#### Attach `root-component` to `shape`

For the created components to work, they need to be attached to the shape.

> [!NOTE]
> The order of joining affects the order of calling components.

```ts
import { create } from "restarfall";

const root = create.component(() => null);

const shape = create.shape();

shape.attach(root());

// You can twice attach `root-component` to `shape`
shape.attach(root());
```

#### Use `value` hook into component

This hook is essential for working with storage data .

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const count = use.value($store);
  return null;
});
```

#### Use `depend` hook into component

This hook is required to subscribe to a storage change or event call. When subscribing to a storage change inside the hook, it is just subscribing to an event `$store.changed`. This is why the return value signatures of this hook are the same. When an event is called, the entire body of the component will be recalled. The return values of this hook will contain an object `{ called: boolean: payload?: EventPayload }`.

> [!IMPORTANT]
> When a component is called again, all child components are unsubscribed from their dependencies. This implementation ensures that an event occurring in the parent component will not be triggered in the child component and will not cause the child component to be called again. In addition, it is possible to enable/disable large branches of business logic under certain conditions.

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

#### Use fast bind to сhanging store

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const count = use.value($count, true);
  return null;
});
```

#### Use `filter` for `depend` hook

The filter is necessary to optimise the call to the component body.

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const countChangedMore2 = use.depend($count, (count) => count > 2);
  return null;
});
```

#### Lock `depend`

Sometimes you just need to get the values of an event but not subscribe to it.

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);

const counter = create.component(() => {
  const countChanged = use.depend($count, false);
  return null;
});
```

#### Use `dispatch` hook into component

This hook is required to change the storage or call an event in the component body.

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

The data hook is needed to get the storage value when the component body context is lost, e.g. in `setTimeout`.

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

This hook will come in handy if you are using `ssr`. Using it you can wait for all asynchronous processes to execute.

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

#### Use `rawData` / `deserialize` / `serialize` into components and shape

These methods are necessary to implement the logic for `ssr`.

> [!IMPORTANT]
> Raw data cannot be deserialised again. For example, if there are two components that deserialise the same data, deserialisation will happen once.

> [!IMPORTANT]
> When deserialising, the value must be set correctly, otherwise you may get errors when trying to work with storage data.

```ts
import { create } from "restarfall";

const $count = create.store<number>(0);
const $token = create.store<string>("empty");

const counter = create.component(() => null, {
  deserialize: (getValue) => ({
    count: {
      store: $count,
      value: getValue("_count_").value,
    },
    token: {
      store: $token,
      value: getValue("token_key").value ?? $token.initialValue,
    },
  }),
  serialize: (getValue) => ({
    _count_: getValue($count),
    _token_: getValue($count),
  }),
});

const shape = create.shape();

shape.setRawData({ _count_: 2 });
shape.attach(counter());

const data = shape.serialize(); // data equal { _count_: 2, _token_: "empty" }
```

### Examples

- [Counter](https://codesandbox.io/s/restarfall-counter-example-3qcqrf?file=/src/index.js)

- [Ticker](https://codesandbox.io/s/restarfall-ticker-example-838w3t?file=/src/index.js)

## API
