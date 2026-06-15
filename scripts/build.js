const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "src");
const BUILD_DIR = path.join(ROOT, "build");
const CONTENT_DIR = path.join(SRC_DIR, "library", "boomiapp", "content");
const BUNDLE_OUT = path.join(CONTENT_DIR, "bundle.js");

const CONTENT_ORDER = [
  "contentScript.js",
  "global.js",
  "svgAssets.js",
  "modalHelper.js",
  "toastHelper.js",
  "pageInit.js",
  "favicon.js",
  "headerActions.js",
  "dashboard.js",
  "shapePalette.js",
  "keyboardShortcuts.js",
  "updateNotification.js",
  "messageEditor.js",
  "reminders.js",
  "buildFilters.js",
  "filterButtons.js",
  "shapePopup.js",
  "menuOpen.js",
  "copyDocument.js",
  "downloadRename.js",
  "scheduleIcons.js",
  "iconSets.js",
  "modalButtons.js",
  "listenerGlobal.js",
  "canvas.js",
  "customRefresh.js",
  "shapes.js",
  "endpointGlow.js",
  "tableWrap.js",
  "imageCapture.js",
  "groups.js",
  "connectionOperations.js",
  "versionNotification.js",
  "sqlEditor.js",
  "brandLogo.js",
];

function getConcatenatedSource() {
  const stubs = `// content-context stubs — real implementations elsewhere or feature removed
const add_fullscreen_listener = () => {};
const add_notecontent_listener = () => {};
`;
  return stubs + CONTENT_ORDER.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    return `// ${filePath}\n${fs.readFileSync(filePath, "utf-8")}\n`;
  }).join("");
}

function generateWebstoreDescription(version) {
  const readmePath = path.join(ROOT, "README.md");
  const outputPath = path.join(ROOT, "webstore-description.txt");

  if (!fs.existsSync(readmePath)) {
    console.log("  Skipping webstore description: README.md not found");
    return;
  }

  const readme = fs.readFileSync(readmePath, "utf-8");

  // Extract the Features section (from "## Features" to next "---" divider)
  const featuresMatch = readme.match(/## Features\n([\s\S]*?)\n---/);
  if (!featuresMatch) {
    console.log("  Skipping webstore description: Features section not found");
    return;
  }

  let features = featuresMatch[1];

  // Convert markdown to plain text
  features = features
    // Strip HTML tags
    .replace(/<[^>]*>/g, "")
    // Strip all emoji (broad unicode ranges + variation selectors)
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[\u{2600}-\u{27BF}]/gu, "")
    .replace(/[\u{2B00}-\u{2BFF}]/gu, "")
    .replace(/[\u{FE00}-\u{FE0F}]/gu, "")
    .replace(/[\u{200D}]/gu, "")
    // Convert bold markers
    .replace(/\*\*(.+?)\*\*/g, "$1")
    // Remove markdown table entirely, replace with indented list
    .replace(/^\| (.+?) \| (.+?) \|$/gm, (_, key, value) => {
      const k = key.trim();
      if (k.match(/^[-:]+$/) || k === "Shortcut") return "";
      return `  - ${k}: ${value.trim()}`;
    })
    // Remove table separator rows (just in case)
    .replace(/^\|[-| :]+\|$/gm, "")
    // Convert category headers to uppercase (allow leading whitespace from stripped emoji)
    .replace(/^\s*([A-Z][A-Za-z &\/]+)$/gm, (_, text) => `\n${text.toUpperCase()}`)
    // Clean up extra blank lines (max 1 consecutive)
    .replace(/\n{3,}/g, "\n\n")
    // Remove back-to-top navigation lines
    .replace(/^\s*↑ Back to top\s*$/gm, "")
    .trim();

  const description = [
    `Boomi Xcel v${version}`,
    "The Boomi Integration Platform Extension",
    "",
    "A browser extension that enhances the Boomi Integration Platform web UI at platform.boomi.com with powerful productivity tools, visual improvements, and workflow optimizations.",
    "",
    "---",
    "",
    features,
    "",
    "---",
    "",
    "All features are configurable via the extension options page.",
    "",
    "DISCLAIMER: Please note that Boomi has no association with this extension and does not sanction its use. They do not offer any guarantees or warranties in relation to its functionality.",
    "",
    "Source code: https://github.com/mitchelljfranklin/BoomiXcel",
  ].join("\n");

  fs.writeFileSync(outputPath, description, "utf-8");
  console.log(`  Generated: webstore-description.txt`);
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
    stdin: { contents: getConcatenatedSource(), resolveDir: CONTENT_DIR, loader: "js" },
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
  const outZip = path.join(BUILD_DIR, `boomi-xcel-${version}-${browserName}.zip`);

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
  console.log(`  Created: build/boomi-xcel-${version}-${browserName}.zip (${sizeKB} KB)`);
}

function createGitHubRelease(version) {
  const tag = `v${version}`;
  const title = `BoomiXcel v${version}`;
  const zipFiles = fs.readdirSync(BUILD_DIR)
    .filter(f => f.startsWith(`boomi-xcel-${version}`) && f.endsWith(".zip"))
    .map(f => path.join(BUILD_DIR, f));

  if (zipFiles.length === 0) {
    console.error("  No zip files found for release. Skipping.");
    return;
  }

  const notes = generateReleaseNotes(version);

  console.log(`\n  Creating GitHub release ${tag}...`);

  try {
    execFileSync("gh", [
      "release", "create", tag,
      "--title", title,
      "--notes", notes,
      ...zipFiles,
    ], { stdio: "inherit" });
    console.log(`  Release ${tag} created successfully.`);
  } catch (err) {
    console.error("  Release creation failed. Ensure gh CLI is installed and authenticated.");
    console.error("  Run: gh auth login   or   export GITHUB_TOKEN=<your-token>");
  }
}

function generateReleaseNotes(version) {
  // Find the most recent tag to diff against
  let lastTag = "";
  try {
    lastTag = execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"], {
      encoding: "utf-8",
      cwd: ROOT,
    }).trim();
  } catch (e) {
    // No prior tags — include all commits
  }

  const range = lastTag ? `${lastTag}..HEAD` : "HEAD";
  let log = "";
  try {
    log = execFileSync("git", [
      "log", range,
      "--no-merges",
      "--pretty=format:%s",
    ], { encoding: "utf-8", cwd: ROOT }).trim();
  } catch (e) {
    // Could not get log — fallback
  }

  if (!log) return "See the README for full feature details.";

  const commits = log.split("\n").filter(Boolean);

  const categories = { feat: [], fix: [], docs: [], style: [], refactor: [], chore: [], other: [] };

  commits.forEach((msg) => {
    const match = msg.match(/^(\w+)(?:\(.+?\))?:\s*(.*)/);
    if (match) {
      const type = match[1];
      const desc = match[2];
      if (categories[type]) {
        categories[type].push(desc);
      } else {
        categories.other.push(msg);
      }
    } else {
      categories.other.push(msg);
    }
  });

  const label = {
    feat: "Features",
    fix: "Bug Fixes",
    docs: "Documentation",
    style: "Styling & UI",
    refactor: "Refactoring",
    chore: "Maintenance",
    other: "Other Changes",
  };

  let notes = "";
  for (const [type, items] of Object.entries(categories)) {
    if (items.length === 0) continue;
    notes += `### ${label[type]}\n\n`;
    items.forEach((item) => { notes += `- ${item}\n`; });
    notes += "\n";
  }

  notes += `**Full Changelog:** https://github.com/mitchelljfranklin/BoomiXcel/compare/${lastTag || "commits"}...v${version}`;

  return notes.trim();
}

async function main() {
  const isWatch = process.argv.includes("--watch") || process.argv.includes("-w");

  if (isWatch) {
    const ctx = await esbuild.context({
      stdin: {
        contents: getConcatenatedSource(),
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
  console.log(`BoomiXcel v${version}\n`);

  // Step 1: Bundle content scripts
  await bundleContent();

  // Step 2: Generate webstore description from README
  generateWebstoreDescription(version);

  // Step 3: Generate per-browser packages
  const base = readBaseManifest();
  base.version = version;

  for (const [name, generator] of Object.entries(BROWSERS)) {
    const manifest = generator(base);
    await createPackage(name, manifest, version);
  }

  console.log(`\nDone. Upload zips from build/ to the respective browser stores.`);

  // Step 4: Create GitHub release if --release flag is set
  if (process.argv.includes("--release")) {
    createGitHubRelease(version);
  }
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
