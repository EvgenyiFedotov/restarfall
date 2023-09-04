module.exports = {
  types: [
    { type: "feat", section: "Features" },
    { type: "fix", section: "Bug Fixes" },
    { type: "chore", hidden: true },
    { type: "docs", hidden: true },
    { type: "style", hidden: true },
    { type: "refactor", hidden: true },
    { type: "perf", hidden: true },
    { type: "test", hidden: true },
  ],
  bumpFiles: [
    { filename: "package.json", type: "json" },
    { filename: "./packges/restarfall/package.json", type: "json" },
    { filename: "./packges/restarfall-react/package.json", type: "json" },
  ],
};
