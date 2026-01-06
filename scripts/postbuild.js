const fs = require("fs");
const path = require("path");

const root = process.cwd();
const standaloneRoot = path.join(root, ".next", "standalone");

if (!fs.existsSync(standaloneRoot)) {
  console.log("No standalone output found; skipping asset copy.");
  process.exit(0);
}

const copyRecursive = (source, destination) => {
  if (!fs.existsSync(source)) {
    console.warn(`Skipping copy, source not found: ${source}`);
    return;
  }
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true, dereference: true });
};

copyRecursive(path.join(root, "public"), path.join(standaloneRoot, "public"));
copyRecursive(
  path.join(root, ".next", "static"),
  path.join(standaloneRoot, ".next", "static")
);

console.log("Standalone assets copied to .next/standalone.");
