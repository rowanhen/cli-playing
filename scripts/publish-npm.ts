#!/usr/bin/env node

import { exec } from "./release-lib.js";
import type { AnalysisResult, PackInfo } from "./types.js";

function main(): void {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // Check if NPM token is available (not needed for dry-run)
  if (!dryRun && !process.env.NODE_AUTH_TOKEN && !process.env.NPM_TOKEN) {
    throw new Error(
      "NPM authentication token not found. Set NODE_AUTH_TOKEN or NPM_TOKEN environment variable."
    );
  }

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

  // Determine npm tag
  const npmTag = analysis.isPrerelease ? "next" : "latest";

  if (dryRun) {
    // Get what would be published
    const publishInfo = exec("npm pack --dry-run --json");
    const packInfo: PackInfo[] = JSON.parse(publishInfo);

    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        version: analysis.version,
        tag: npmTag,
        files: packInfo[0]?.files?.length || "unknown",
        size: packInfo[0]?.size || "unknown",
      })
    );
    return;
  }

  // Publish to NPM
  try {
    const output = exec(`npm publish --tag ${npmTag}`);

    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        version: analysis.version,
        tag: npmTag,
        output: output.split("\n").slice(-3).join("\n"), // Last few lines of output
      })
    );
  } catch (error) {
    // NPM publish errors often have useful info in stderr
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`NPM publish failed: ${errorMessage}`);
  }
}

try {
  main();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: errorMessage }));
  process.exit(1);
}
