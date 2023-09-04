# Restarfall

## Commits

Create commits by [conventional-commits](https://www.conventionalcommits.org/en/v1.0.0/). For one use `commitlint`.

## Release

For relase use `standard-version`;

For first relase run

```sh
npm run release -- --first-release
```

For next releases run

```sh
npm run release
```

## Publish

### Prerelase

```sh
npm run pre-release && git push --follow-tags origin main
```

### Relase

```sh
npm run release && git push --follow-tags origin main
```
