const path = require("path");

const common = {
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              cacheDirectory: true,
            },
          },
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};

const cjs = {
  entry: {
    index: path.resolve(process.cwd(), "./src/index.ts"),
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.resolve(process.cwd(), "./dist/cjs"),
    filename: "./[name].js",
    clean: true,
  },
};

const mjs = {
  experiments: {
    // outputModule: true,
  },
  entry: {
    index: path.resolve(process.cwd(), "./src/index.ts"),
  },
  output: {
    path: path.resolve(process.cwd(), "./dist/mjs"),
    filename: "./[name].js",
    clean: true,
    // module: true,
  },
};

module.exports = { common, cjs, mjs };
