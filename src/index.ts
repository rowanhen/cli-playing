// Main exports for programmatic usage
export { ReleaseOrchestrator } from "./funcs/release-orchestrator.js";
export * from "./release-lib.js";
export * from "./types.js";

// Re-export modular components
export * from "./funcs/changelog-generator.js";
export * from "./funcs/git-operations.js";
export * from "./funcs/github-release.js";
export * from "./funcs/npm-publisher.js";
export * from "./funcs/release-orchestrator.js";
export * from "./funcs/repository-utils.js";
export * from "./funcs/version-manager.js";

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
  isReleaseCommit,
  parseCommit,
} from "./release-lib.js";
