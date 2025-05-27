// Main exports for programmatic usage
export { ReleaseAutomation } from "./release-automation.js";
export * from "./release-lib.js";
export * from "./types.js";

// Re-export individual functions for convenience
export {
  analyzeCommits,
  bumpVersion,
  CONFIG as defaultConfig,
  formatChangelogEntry,
  formatReleaseNotes,
  getCommitsSinceLastTag,
  getCurrentBranch,
  getPackageJson,
  getPrereleaseTag,
  isBranchAllowed,
  parseCommit,
} from "./release-lib.js";
