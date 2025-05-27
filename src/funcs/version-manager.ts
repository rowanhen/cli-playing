import type { AnalysisResult, ReleaseStepResult } from "../types.js";
import { analyzeCommits } from "../utils/commit-parser.js";
import {
  getCommitsSinceLastTag,
  getCurrentBranch,
  getPrereleaseTag,
  isBranchAllowed,
} from "../utils/git.js";
import { getPackageJson, savePackageJson } from "../utils/package.js";
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

    // Get commits since last tag
    const commits = getCommitsSinceLastTag();
    if (commits.length === 0) {
      return {
        error: "No commits found since last tag",
        bump: "patch",
        version: currentVersion,
        currentVersion,
        hasChanges: false,
        changes: {},
      };
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

    // Determine if there are visible changes
    const hasChanges = Object.keys(analysis.changes).length > 0;

    // Extract commit subjects for detailed output
    const commitSubjects = commits
      .map((commit) => {
        const lines = commit.trim().split("\n");
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
  }

  return {
    success: true,
    dryRun,
    oldVersion,
    newVersion: analysis.version,
  };
}
