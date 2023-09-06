const fs = require("fs/promises");
const path = require("path");

const updateDepends = async (path) => {
  const packageJson = JSON.parse((await fs.readFile(path)).toString());

  for (const key in packageJson.peerDependencies) {
    if (key.startsWith("restarfall")) {
      packageJson.peerDependencies[key] = packageJson.version;
    }
  }

  await fs.writeFile(path, JSON.stringify(packageJson, null, 2) + "\n");
};

const root = path.resolve(__dirname, "../packages");

fs.readdir(root).then((folders) => {
  Promise.allSettled(
    folders.map(async (folder) => {
      const packageJsonPath = path.resolve(root, folder, "package.json");

      await fs.access(packageJsonPath);
      await updateDepends(packageJsonPath);
    }),
  );
});
