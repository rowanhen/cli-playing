#!/usr/bin/env node

import { formatReleaseNotes } from "./release-lib.js";
import type { AnalysisResult, GitHubRelease } from "./types.js";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // Check required environment variables (not needed for dry-run)
  const { GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;

  if (!dryRun && !GITHUB_TOKEN) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }

  if (!dryRun && !GITHUB_REPOSITORY) {
    throw new Error("GITHUB_REPOSITORY environment variable is required");
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
    const { execSync } = await import("child_process");
    const result = execSync("npx tsx scripts/analyze-commits.ts", {
      encoding: "utf8",
    });
    analysis = JSON.parse(result);
  }

  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const tag = `v${analysis.version}`;

  // Generate release notes
  const body = analysis.hasChanges
    ? formatReleaseNotes(analysis.changes)
    : `Release ${analysis.version}\n\n_This release contains only internal changes._`;

  if (dryRun) {
    console.log(
      JSON.stringify({
        success: true,
        dryRun,
        version: analysis.version,
        tag,
        name: tag,
        prerelease: analysis.isPrerelease,
        bodyLength: body.length,
        sections: analysis.hasChanges ? Object.keys(analysis.changes) : [],
      })
    );
    return;
  }

  if (!GITHUB_REPOSITORY) {
    throw new Error("GITHUB_REPOSITORY environment variable is required");
  }

  const [owner, repo] = GITHUB_REPOSITORY.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid GITHUB_REPOSITORY format. Expected 'owner/repo'");
  }

  // Create release via GitHub API
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/releases`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        tag_name: tag,
        name: tag,
        body: body,
        draft: false,
        prerelease: analysis.isPrerelease,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} - ${error}`);
  }

  const release = (await response.json()) as GitHubRelease;

  console.log(
    JSON.stringify({
      success: true,
      dryRun,
      version: analysis.version,
      tag,
      url: release.html_url,
      id: release.id,
    })
  );
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ error: errorMessage }));
  process.exit(1);
});
