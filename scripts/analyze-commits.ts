#!/usr/bin/env node

import {
  analyzeCommits,
  bumpVersion,
  getCommitsSinceLastTag,
  getCurrentBranch,
  getPackageJson,
  getPrereleaseTag,
  isBranchAllowed,
} from "./release-lib.js";
import type { AnalysisResult } from "./types.js";

function main(): void {
  try {
    // Get current package version
    const pkg = getPackageJson();
    const currentVersion = pkg.version;

    // Check if we're on an allowed branch
    const currentBranch = getCurrentBranch();
    if (!isBranchAllowed(currentBranch)) {
      const result: AnalysisResult = {
        error: `Branch '${currentBranch}' is not allowed for releases. Use 'main' or feature/fix/chore branches.`,
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
      console.log(JSON.stringify(result));
      return;
    }

    // Get commits since last tag
    const commits = getCommitsSinceLastTag();
    if (commits.length === 0) {
      const result: AnalysisResult = {
        error: "No commits found since last tag",
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
      console.log(JSON.stringify(result));
      return;
    }

    // Analyze commits
    const analysis = analyzeCommits(commits);

    // Determine if this is a prerelease
    const prereleaseTag = getPrereleaseTag(currentBranch);
    const isPrerelease = !!prereleaseTag;

    // Calculate new version
    const newVersion = bumpVersion(
      currentVersion,
      analysis.bump,
      prereleaseTag
    );

    // Determine if there are visible changes (not just hidden changes)
    const hasChanges = Object.keys(analysis.changes).length > 0;

    // Extract commit subjects for detailed output
    const commitSubjects = commits
      .map((commit) => {
        const lines = commit.trim().split("\n");
        return lines[0] || "";
      })
      .filter((subject) => subject.trim());

    const result: AnalysisResult = {
      bump: analysis.bump,
      version: newVersion,
      currentVersion,
      hasChanges,
      isPrerelease,
      changes: analysis.changes,
      hasOnlyHiddenChanges: analysis.hasOnlyHiddenChanges,
      // Add detailed information for dry-run output
      packageName: pkg.name,
      branch: currentBranch,
      commitCount: commits.length,
      commitSubjects,
      prereleaseTag,
    };

    console.log(JSON.stringify(result));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const result: AnalysisResult = {
      error: errorMessage,
      bump: "patch",
      version: "0.0.0",
      currentVersion: "0.0.0",
      hasChanges: false,
      changes: {},
    };
    console.log(JSON.stringify(result));
    process.exit(1);
  }
}

main();
