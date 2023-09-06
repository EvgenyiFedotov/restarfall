const { common, cjs, mjs } = require("./common");

common.mode = "production";

module.exports = [
  { ...common, ...cjs },
  { ...common, ...mjs },
];
