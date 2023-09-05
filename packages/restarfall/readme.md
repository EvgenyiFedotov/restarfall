# restarfall

Restarfall is a JavaScript library for creating business logic and data management.

## Usage

```ts
import { create, use } from "restarfall";

const $count = create.store(0);
const inc = create.event();
const dec = create.event();

const counter = create.component(() => {
  const count = use.value($count);
  const setCount = use.dispatch($count);
  if (use.depend(inc).called) setCount(count + 1);
  else if (use.depend(dec).called) setCount(count - 1);
  return null;
});

const shape = create.shape();
shape.attach(counter());
```

## Documentation

## API
