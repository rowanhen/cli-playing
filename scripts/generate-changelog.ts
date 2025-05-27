#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { formatChangelogEntry } from "./release-lib.js";
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

  // Skip if no changes or if prerelease
  if (!analysis.hasChanges || analysis.isPrerelease) {
    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        skipped: true,
        reason: analysis.isPrerelease ? "prerelease" : "no-changes",
      })
    );
    return;
  }

  // Read existing changelog
  let changelog = "";
  try {
    changelog = readFileSync("CHANGELOG.md", "utf8");
  } catch {
    // Create new changelog
    changelog =
      "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
  }

  // Generate new entry
  const newEntry = formatChangelogEntry(analysis.version, analysis.changes);

  // Insert new entry after header (at line 3 or 4)
  const lines = changelog.split("\n");
  let insertIndex = 2; // Default: after "# Changelog" and empty line

  // Find where to insert (after any header text, before first version entry)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i]?.startsWith("## [")) {
      insertIndex = i;
      break;
    }
  }

  lines.splice(insertIndex, 0, newEntry.trim());

  // Write updated changelog
  if (!dryRun) {
    writeFileSync("CHANGELOG.md", lines.join("\n"));
  }

  console.log(
    JSON.stringify({
      success: true,
      dryRun,
      version: analysis.version,
      sections: Object.keys(analysis.changes),
      wouldInsertAt: insertIndex,
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
