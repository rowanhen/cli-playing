#!/usr/bin/env node

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

  const tag = `v${analysis.version}`;

  if (dryRun) {
    // Check if tag already exists
    let tagExists = false;
    try {
      exec(`git rev-parse ${tag}`);
      tagExists = true;
    } catch {}

    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        tag,
        version: analysis.version,
        wouldCreate: !tagExists,
        alreadyExists: tagExists,
      })
    );
    return;
  }

  // Create annotated tag
  const tagMessage = `Release ${analysis.version}`;
  exec(`git tag -a ${tag} -m "${tagMessage}"`);

  console.log(
    JSON.stringify({
      success: true,
      dryRun,
      tag,
      version: analysis.version,
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
