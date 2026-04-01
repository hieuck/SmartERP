import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "apps", "web", "dist");
const buildDir = path.join(rootDir, "apps", "web", "build");
const summaryPath = path.join(buildDir, "build-summary.json");

const buildBudget = {
  largestJavaScriptAssetLimitBytes: 800_000,
  totalJavaScriptLimitBytes: 1_500_000,
  totalCssLimitBytes: 100_000,
};

async function listFilesRecursively(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        return listFilesRecursively(fullPath);
      }

      return [fullPath];
    }),
  );

  return nestedFiles.flat();
}

function toRelativePath(filePath) {
  return path.relative(distDir, filePath).replaceAll("\\", "/");
}

function getAssetType(filePath) {
  if (filePath.endsWith(".js")) {
    return "script";
  }

  if (filePath.endsWith(".css")) {
    return "style";
  }

  return "static";
}

function isVendorAsset(fileName) {
  return fileName.includes("vendor");
}

async function main() {
  const distExists = await fs
    .stat(distDir)
    .then((stats) => stats.isDirectory())
    .catch(() => false);

  if (!distExists) {
    throw new Error(`Build output directory was not found: ${distDir}`);
  }

  const files = await listFilesRecursively(distDir);
  const assetRecords = await Promise.all(
    files.map(async (filePath) => {
      const stats = await fs.stat(filePath);
      const relativePath = toRelativePath(filePath);
      const fileName = path.basename(filePath);

      return {
        fileName,
        relativePath,
        assetType: getAssetType(filePath),
        sizeBytes: stats.size,
        vendor: isVendorAsset(fileName),
      };
    }),
  );

  const sortedAssets = [...assetRecords].sort((left, right) => right.sizeBytes - left.sizeBytes);
  const scriptAssets = sortedAssets.filter((asset) => asset.assetType === "script");
  const styleAssets = sortedAssets.filter((asset) => asset.assetType === "style");
  const largestJavaScriptAsset = scriptAssets[0] ?? null;
  const totalAssetBytes = sortedAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const totalJavaScriptBytes = scriptAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const totalCssBytes = styleAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const budgetStatus = {
    ...buildBudget,
    largestJavaScriptAssetPass:
      largestJavaScriptAsset !== null &&
      largestJavaScriptAsset.sizeBytes <= buildBudget.largestJavaScriptAssetLimitBytes,
    totalJavaScriptPass: totalJavaScriptBytes <= buildBudget.totalJavaScriptLimitBytes,
    totalCssPass: totalCssBytes <= buildBudget.totalCssLimitBytes,
  };

  const summary = {
    checkedAt: new Date().toISOString(),
    summaryPath,
    distPath: distDir,
    totalAssetCount: sortedAssets.length,
    totalAssetBytes,
    totalJavaScriptBytes,
    totalCssBytes,
    largestJavaScriptAsset,
    vendorAssets: scriptAssets.filter((asset) => asset.vendor).slice(0, 5),
    featureAssets: scriptAssets.filter((asset) => !asset.vendor).slice(0, 5),
    budget: {
      ...budgetStatus,
      passed:
        budgetStatus.largestJavaScriptAssetPass &&
        budgetStatus.totalJavaScriptPass &&
        budgetStatus.totalCssPass,
    },
  };

  await fs.mkdir(buildDir, { recursive: true });
  await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
