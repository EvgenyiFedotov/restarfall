# restarfall

Restarfall is a JavaScript library for creating business logic and data management.

## Usage

```ts
import { create, use } from "restarfall";

const $count = create.store<number>(0);
const inc = create.event<void>();
const dec = create.event<void>();

const counter = create.component(() => {
  const incEvent = use.depend(inc);
  const decEvent = use.depend(dec);
  const count = use.value($count);
  const setCount = use.dispatch($count);
  if (incEvent.called) setCount(count + 1);
  else if (decEvent.called) setCount(count - 1);
  return null;
});

const shape = create.shape();

shape.attach(counter());
```

## Documentation

### You can

## API
