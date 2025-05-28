import { CONFIG } from "../config.js";
import type { AnalysisResult, ReleaseStepResult } from "../types.js";
import { analyzeCommits, isReleaseCommit } from "../utils/commit-parser.js";
import {
  getCommitsWithHashesSinceLastTag,
  getCurrentBranch,
  getPrereleaseTag,
  isBranchAllowed,
} from "../utils/git.js";
import { getPackageJson, savePackageJson } from "../utils/package.js";
import { exec } from "../utils/shell.js";
import { bumpVersion } from "../utils/version.js";

/**
 * Analyze commits and determine what kind of release should be made
 */
export async function analyzeCommitsForRelease(): Promise<AnalysisResult> {
  try {
    // Get current package version
    const pkg = getPackageJson();
    const currentVersion = pkg.version;

    // Check if we're on an allowed branch
    const currentBranch = getCurrentBranch();
    if (!isBranchAllowed(currentBranch)) {
      return {
        error: `Branch '${currentBranch}' is not allowed for releases. Use 'main' or feature/fix/chore branches.`,
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
    }

    // Get commits since last tag with hashes
    const allCommits = getCommitsWithHashesSinceLastTag();
    if (allCommits.length === 0) {
      return {
        error: "No commits found since last tag",
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
    }

    // Filter out release commits before analyzing
    const commits = allCommits.filter(
      (commit) => !isReleaseCommit(commit.message)
    );

    if (commits.length === 0) {
      return {
        error: "No non-release commits found since last tag",
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
    }

    // Analyze commits with metadata for linking
    const analysis = analyzeCommits(commits, CONFIG, CONFIG.breakingKeywords);

    // Determine if this is a prerelease
    const prereleaseTag = getPrereleaseTag(currentBranch);
    const isPrerelease = !!prereleaseTag;

    // Calculate new version
    const newVersion = bumpVersion(
      currentVersion,
      analysis.bump,
      prereleaseTag
    );

    // Determine if there are visible changes
    const hasChanges = Object.keys(analysis.changes).length > 0;

    // Extract commit subjects for detailed output (from filtered commits)
    const commitSubjects = commits
      .map((commit) => {
        const lines = commit.message.trim().split("\n");
        return lines[0] || "";
      })
      .filter((subject) => subject.trim());

    return {
      bump: analysis.bump,
      version: newVersion,
      currentVersion,
      hasChanges,
      isPrerelease,
      changes: analysis.changes,
      hasOnlyHiddenChanges: analysis.hasOnlyHiddenChanges,
      packageName: pkg.name,
      branch: currentBranch,
      commitCount: commits.length,
      commitSubjects,
      prereleaseTag,
      // Store commit metadata for linking
      commitMeta: analysis.commitMeta,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: errorMessage,
      bump: "patch",
      version: "0.0.0",
      currentVersion: "0.0.0",
      hasChanges: false,
      changes: {},
    };
  }
}

/**
 * Bump the version in package.json
 */
export async function bumpPackageVersion(
  analysis: AnalysisResult,
  dryRun = false
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const pkg = getPackageJson();
  const oldVersion = pkg.version;

  if (!dryRun) {
    pkg.version = analysis.version;
    savePackageJson(pkg);

    // Update package-lock.json by running npm install
    // This ensures the package-lock.json version matches package.json
    try {
      exec("npm install --package-lock-only");
    } catch (error) {
      // If npm install fails, try without the flag (fallback for older npm versions)
      try {
        exec("npm install --no-save");
      } catch (fallbackError) {
        console.warn(
          "Warning: Could not update package-lock.json automatically"
        );
      }
    }
  }

  return {
    success: true,
    dryRun,
    oldVersion,
    newVersion: analysis.version,
  };
}
