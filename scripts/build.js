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
  "copyXml.js",
  "downloadRename.js",
  "documentViewer.js",
  "scheduleIcons.js",
  "iconSets.js",
  "modalButtons.js",
  "listenerGlobal.js",
  "defaultScriptingLanguage.js",
  "canvas.js",
  "customRefresh.js",
  "processDuration.js",
  "shapes.js",
  "endpointGlow.js",
  "setPropertiesExtractor.js",
  "tableWrap.js",
  "imageCapture.js",
  "connectionOperations.js",
  "versionNotification.js",
  "sqlEditor.js",
  "nativeEditorResize.js",
  "brandLogo.js",
  "boomiGpt.js",
  "viewInReporting.js",
];

function getConcatenatedSource() {
  const changelogHtml = extractUpdateChangelog();

  const stubs = `// content-context stubs — real implementations elsewhere or feature removed
const add_fullscreen_listener = () => {};
const add_notecontent_listener = () => {};
${changelogHtml}
`;
  return stubs + CONTENT_ORDER.map((filename) => {
    const filePath = path.join(CONTENT_DIR, filename);
    return `// ${filePath}\n${fs.readFileSync(filePath, "utf-8")}\n`;
  }).join("");
}

function extractUpdateChangelog() {
  const changelogPath = path.join(ROOT, "updateNotification.md");
  if (!fs.existsSync(changelogPath)) return "";

  const content = fs.readFileSync(changelogPath, "utf-8").replace(/\r\n/g, "\n");
  const lines = content.split("\n");
  const items = [];
  var intro = "";

  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim();
    if (!line) continue;
    var htmlLine = convertMarkdownLinks(line);
    if (line.startsWith("- ")) {
      items.push("<li><p>" + htmlLine.substring(2) + "</p></li>");
    } else if (!intro) {
      intro = "<p>" + htmlLine + "</p>";
    }
  }

  if (items.length === 0 && !intro) return "";

  var html = intro + (items.length > 0 ? "<ul>" + items.join("") + "</ul>" : "");
  return "var UPDATE_CHANGELOG_HTML = " + JSON.stringify(html) + ";\n";
}

function convertMarkdownLinks(text) {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function cleanInlineMarkdown(text) {
  // Protect inline code span contents (e.g. `<ProcessName>_<timestamp>.<ext>`)
  // so the HTML-tag stripper doesn't treat the angle-bracket placeholders as tags.
  const codeSpans = [];
  let working = text.replace(/`([^`]+)`/g, (match, inner) => {
    codeSpans.push(inner);
    return `\u0000${codeSpans.length - 1}\u0000`;
  });

  working = decodeHtmlEntities(
    working
      .replace(/<[^>]*>/g, "")
      .replace(/\*\*(.+?)\*\*/g, "$1"),
  );

  return working.replace(/\u0000(\d+)\u0000/g, (match, index) => codeSpans[Number(index)]);
}

function generateWebstoreDescription(version) {
  const readmePath = path.join(ROOT, "README.md");
  const outputPath = path.join(ROOT, "webstore-description.txt");

  if (!fs.existsSync(readmePath)) {
    console.log("  Skipping webstore description: README.md not found");
    return;
  }

  const readme = fs.readFileSync(readmePath, "utf-8");

  // Normalize line endings for cross-platform consistency
  const normalizedReadme = readme.replace(/\r\n/g, "\n");

  // Extract the Features section heading + body (handles \r\n and \n)
  const featuresMatch = normalizedReadme.match(
    /## ([^\n]*Features)\n([\s\S]*?)\n(?=## )/,
  );
  if (!featuresMatch) {
    console.log("  Skipping webstore description: Features section not found");
    return;
  }

  const featuresHeading = cleanInlineMarkdown(featuresMatch[1].trim());

  // Convert the features body line-by-line, preserving emoji and structure
  const bodyLines = featuresMatch[2].split("\n");
  const convertedLines = [];

  for (let lineIndex = 0; lineIndex < bodyLines.length; lineIndex++) {
    const rawLine = bodyLines[lineIndex];
    const tableRowMatch = rawLine.match(/^\s*\|(.+)\|\s*$/);

    if (tableRowMatch) {
      const cells = tableRowMatch[1].split("|").map((cell) => cell.trim());

      // Drop separator rows like |----|----|
      if (cells.every((cell) => /^:?-+:?$/.test(cell))) {
        continue;
      }

      const cleanedCells = cells.map((cell) => cleanInlineMarkdown(cell));
      const nextLine = bodyLines[lineIndex + 1]
        ? bodyLines[lineIndex + 1].trim()
        : "";
      const isHeaderRow = /^\|[-| :]+\|$/.test(nextLine);

      convertedLines.push(
        isHeaderRow ? cleanedCells.join("\t") : `- ${cleanedCells.join("\t")}`,
      );
      continue;
    }

    const cleanedLine = cleanInlineMarkdown(rawLine);

    // Drop back-to-top navigation lines
    if (/^\s*↑ Back to top\s*$/.test(cleanedLine)) {
      continue;
    }

    convertedLines.push(cleanedLine);
  }

  const featuresBody = convertedLines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const features = `${featuresHeading}\n\n${featuresBody}`;

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

  // action → browser_action (MV3→MV2)
  if (manifest.action) {
    manifest.browser_action = manifest.action;
    delete manifest.action;
  }

  // background.service_worker → background.scripts (MV3→MV2)
  if (manifest.background?.service_worker) {
    manifest.background = { scripts: [manifest.background.service_worker] };
  }

  // Merge host_permissions into permissions (MV3→MV2)
  if (manifest.host_permissions) {
    manifest.permissions = (manifest.permissions || []).concat(manifest.host_permissions);
    delete manifest.host_permissions;
  }

  // Flatten web_accessible_resources from MV3 object array to MV2 string array
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

  // Strip individual content scripts — only bundle.js is needed at runtime
  const tmpContentDir = path.join(tmpDir, "library", "boomiapp", "content");
  for (const filename of CONTENT_ORDER) {
    try { fs.unlinkSync(path.join(tmpContentDir, filename)); } catch (e) {}
  }

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
  // Find the most recent tag to diff against (for the compare link only)
  let lastTag = "";
  try {
    lastTag = execFileSync("git", ["describe", "--tags", "--abbrev=0", "--match", "v*"], {
      encoding: "utf-8",
      cwd: ROOT,
    }).trim();
  } catch (e) {
    // No prior tags
  }

  const compareLink = `**Full Changelog:** https://github.com/mitchelljfranklin/BoomiXcel/compare/${lastTag || "commits"}...v${version}`;

  // Release notes come from updateNotification.md (already markdown bullets)
  const changelogPath = path.join(ROOT, "updateNotification.md");
  let changelog = "";
  if (fs.existsSync(changelogPath)) {
    changelog = fs.readFileSync(changelogPath, "utf-8").replace(/\r\n/g, "\n").trim();
  }

  if (!changelog) {
    return `See the README for full feature details.\n\n${compareLink}`;
  }

  return `## What's New in v${version}\n\n${changelog}\n\n${compareLink}`;
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
      sourcemap: "inline",
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
