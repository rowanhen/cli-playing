#!/usr/bin/env node

import { getPackageJson, savePackageJson } from "./release-lib.js";
import type { AnalysisResult } from "./types.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // Get analysis results from environment variable
  let analysis: AnalysisResult;

  if (process.env.RELEASE_ANALYSIS) {
    try {
      analysis = JSON.parse(process.env.RELEASE_ANALYSIS);
    } catch (e) {
      throw new Error("Failed to parse RELEASE_ANALYSIS environment variable");
    }
  } else {
    // Fallback: re-run analysis
    const { execSync } = await import("child_process");
    const result = execSync("npx tsx scripts/analyze-commits.ts", {
      encoding: "utf8",
    });
    analysis = JSON.parse(result);
  }

  if (analysis.error) {
    throw new Error(analysis.error);
  }

  // Update package.json
  const pkg = getPackageJson();

  if (!dryRun) {
    pkg.version = analysis.version;
    savePackageJson(pkg);
  }

  console.log(
    JSON.stringify({
      success: true,
      dryRun,
      oldVersion: analysis.currentVersion,
      newVersion: analysis.version,
    })
  );
}

try {
  main();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: errorMessage }));
  process.exit(1);
}
