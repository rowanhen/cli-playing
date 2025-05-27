#!/usr/bin/env node

import { existsSync } from "fs";
import { exec } from "./release-lib.js";
import type { AnalysisResult } from "./types.js";

function main(): void {
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
    const result = exec("npx tsx scripts/analyze-commits.ts");
    analysis = JSON.parse(result);
  }

  if (analysis.error) {
    throw new Error(analysis.error);
  }

  // Skip commits for prereleases
  if (analysis.isPrerelease) {
    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        skipped: true,
        reason: "prerelease",
      })
    );
    return;
  }

  // Check what files have been modified
  const status = exec("git status --porcelain");

  if (dryRun) {
    // In dry-run, simulate what would be committed
    const filesToCommit: string[] = [];
    filesToCommit.push("package.json"); // Always would be changed

    if (analysis.hasChanges) {
      filesToCommit.push("CHANGELOG.md");
    }

    if (existsSync("package-lock.json")) {
      filesToCommit.push("package-lock.json");
    }

    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        version: analysis.version,
        message: `chore(release): ${analysis.version} [skip ci]`,
        files: filesToCommit,
      })
    );
    return;
  }

  if (!status) {
    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        skipped: true,
        reason: "no-changes",
      })
    );
    return;
  }

  // Add files to git
  exec("git add package.json");

  // Add CHANGELOG.md if it was modified
  if (existsSync("CHANGELOG.md") && status.includes("CHANGELOG.md")) {
    exec("git add CHANGELOG.md");
  }

  // Add package-lock.json if it exists and was modified
  if (existsSync("package-lock.json") && status.includes("package-lock.json")) {
    exec("git add package-lock.json");
  }

  // Commit with skip CI message
  const commitMessage = `chore(release): ${analysis.version} [skip ci]`;
  exec(`git commit -m "${commitMessage}"`);

  console.log(
    JSON.stringify({
      success: true,
      dryRun,
      version: analysis.version,
      message: commitMessage,
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
