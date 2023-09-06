const { common, cjs, mjs } = require("./common");

common.mode = "development";

module.exports = [
  { ...common, ...cjs },
  { ...common, ...mjs },
];
