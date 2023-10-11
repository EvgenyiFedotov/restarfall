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
            loader: require.resolve("ts-loader"),
            options: {
              configFile: path.resolve(__dirname, "../tsconfig.json"),
            },
          },
        ],
      },
    ],
  },
};

const cjs = {
  entry: {
    index: path.resolve(process.cwd(), "./src/index.ts"),
    uitls: path.resolve(process.cwd(), "./src/utils/index.ts"),
  },
  output: {
    libraryTarget: "commonjs2",
    path: path.resolve(process.cwd(), "./dist/cjs"),
    filename: "./[name].js",
  },
};

const mjs = {
  experiments: {
    outputModule: true,
  },
  entry: {
    index: path.resolve(process.cwd(), "./src/index.ts"),
    uitls: path.resolve(process.cwd(), "./src/utils/index.ts"),
  },
  output: {
    path: path.resolve(process.cwd(), "./dist/mjs"),
    filename: "./[name].js",
    library: { type: "module" },
  },
};

module.exports = { common, cjs, mjs };
