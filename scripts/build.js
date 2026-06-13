const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const BUILD_DIR = path.join(ROOT, "build");
const CONTENT_DIR = path.join(SRC_DIR, "library", "boomiapp", "content");
const BUNDLE_OUT = path.join(CONTENT_DIR, "bundle.js");

const CONTENT_ORDER = [
  "contentScript.js",
  "global.js",
  "boomi.js",
  "clickComponents.js",
  "dashboard.js",
  "buildPallet.js",
  "shortCuts.js",
  "updateNotification.js",
  "messageEditor.js",
  "reminders.js",
  "buildFilters.js",
  "filterButtons.js",
  "quickclickComponent.js",
  "menuOpen.js",
  "scheduleIcons.js",
  "iconSets.js",
  "listenerGlobal.js",
  "canvas.js",
  "customRefresh.js",
  "shapes.js",
  "descriptionMarkdown.js",
  "tableWrap.js",
  "modalButtons.js",
  "notes.js",
  "imageCapture.js",
  "groups.js",
  "connectionOperations.js",
  "versionNotification.js",
  "shortcut.js",
];

function getImportStatements() {
  return CONTENT_ORDER.map((filename) => `import './${filename}';`).join("\n");
}

function getVersion() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8")).version;
}

function readBaseManifest() {
  return JSON.parse(fs.readFileSync(path.join(SRC_DIR, "manifest.json"), "utf-8"));
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateFirefoxManifest(base) {
  const manifest = clone(base);
  manifest.manifest_version = 2;
  delete manifest.update_url;
  if (manifest.web_accessible_resources?.[0]?.resources) {
    manifest.web_accessible_resources = manifest.web_accessible_resources[0].resources;
  }
  return manifest;
}

function generateEdgeManifest(base) {
  const manifest = clone(base);
  delete manifest.update_url;
  return manifest;
}

function generateChromeManifest(base) {
  return clone(base);
}

const BROWSERS = {
  Chrome: generateChromeManifest,
  Firefox: generateFirefoxManifest,
  Edge: generateEdgeManifest,
};

async function bundleContent() {
  await esbuild.build({
    stdin: { contents: getImportStatements(), resolveDir: CONTENT_DIR, loader: "js" },
    outfile: BUNDLE_OUT,
    bundle: true,
    format: "iife",
    target: "es2015",
  });
  console.log(`  Bundled: src/library/boomiapp/content/bundle.js`);
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function createPackage(browserName, manifest, version) {
  const tmpDir = path.join(BUILD_DIR, `.tmp-${browserName}`);
  const outZip = path.join(BUILD_DIR, `boomi-platform-enhancer-${version}-${browserName}.zip`);

  // Clean
  fs.rmSync(tmpDir, { recursive: true, force: true });
  try { fs.unlinkSync(outZip); } catch (e) {}

  // Copy src/ into tmp/
  copyDir(SRC_DIR, tmpDir);

  // Overwrite manifest with browser-specific variant
  fs.rmSync(path.join(tmpDir, "manifest.json"));
  fs.writeFileSync(path.join(tmpDir, "manifest.json"), JSON.stringify(manifest, null, 4));

  // Zip
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outZip);
    const archive = archiver("zip", { zlib: { level: 9 } });
    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.directory(tmpDir, false);
    archive.finalize();
  });

  // Clean up
  fs.rmSync(tmpDir, { recursive: true, force: true });

  const sizeKB = Math.round(fs.statSync(outZip).size / 1024);
  console.log(`  Created: build/boomi-platform-enhancer-${version}-${browserName}.zip (${sizeKB} KB)`);
}

async function main() {
  const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

  if (isWatch) {
    const ctx = await esbuild.context({
      stdin: {
        contents: getImportStatements(),
        resolveDir: CONTENT_DIR,
        loader: "js",
      },
      outfile: BUNDLE_OUT,
      bundle: true,
      format: "iife",
      target: "es2015",
    });
    await ctx.watch();
    console.log("Watching content scripts for changes...");
    return;
  }

  const version = getVersion();
  console.log(`Boomi Platform Enhancer v${version}\n`);

  // Step 1: Bundle content scripts
  await bundleContent();

  // Step 2: Generate per-browser packages
  const base = readBaseManifest();
  base.version = version;

  for (const [name, generator] of Object.entries(BROWSERS)) {
    const manifest = generator(base);
    await createPackage(name, manifest, version);
  }

  console.log(`\nDone. Upload zips from build/ to the respective browser stores.`);
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
