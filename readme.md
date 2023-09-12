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

## API

## Commits

Create commits by [conventional-commits](https://www.conventionalcommits.org/en/v1.0.0/). For one use `commitlint`.

## Release

For relase use `standard-version`.

### First relase

```sh
npm run release -- --first-release
```

#### Next releases

```sh
npm run release
```

After push to remote-repo run workflow `Publish  to npmjs` from `actions` tab into GitHub.
