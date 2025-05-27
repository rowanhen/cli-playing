// Main exports for programmatic usage
export { ReleaseOrchestrator } from "./funcs/release-orchestrator.js";
export * from "./types.js";

// Re-export modular components
export * from "./funcs/changelog-generator.js";
export * from "./funcs/git-operations.js";
export * from "./funcs/github-release.js";
export * from "./funcs/npm-publisher.js";
export * from "./funcs/release-orchestrator.js";
export * from "./funcs/repository-utils.js";
export * from "./funcs/version-manager.js";

// Re-export utilities
export * from "./config.js";
export * from "./utils/commit-parser.js";
export * from "./utils/formatting.js";
export * from "./utils/git.js";
export * from "./utils/package.js";
export * from "./utils/shell.js";
export * from "./utils/version.js";

// Re-export individual functions for convenience
export { CONFIG as defaultConfig } from "./config.js";
export {
  analyzeCommits,
  isReleaseCommit,
  parseCommit,
} from "./utils/commit-parser.js";
export {
  formatChangelogEntry,
  formatReleaseNotes,
} from "./utils/formatting.js";
export {
  getCommitsSinceLastTag,
  getCurrentBranch,
  getPrereleaseTag,
  isBranchAllowed,
} from "./utils/git.js";
export { getPackageJson, savePackageJson } from "./utils/package.js";
export { exec, execQuiet } from "./utils/shell.js";
export { bumpVersion } from "./utils/version.js";
