// Main exports for programmatic usage
export { generateChangelog } from "./funcs/changelog-generator.js";
export { createGithubRelease } from "./funcs/github-release.js";
export { publishNpm } from "./funcs/npm-publisher.js";
export { getRepositoryInfo } from "./funcs/repository-utils.js";
export {
  analyzeCommitsForRelease,
  bumpPackageVersion,
} from "./funcs/version-manager.js";

// Re-export modular components for advanced usage
export { CONFIG } from "./config.js";
export type {
  AnalysisResult,
  CommitTypeConfig,
  Config,
  ReleaseOptions,
  ReleaseStepResult,
} from "./types.js";

// Utilities
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
  getCommitsWithHashesSinceLastTag,
  getCurrentBranch,
  getPrereleaseTag,
  isBranchAllowed,
} from "./utils/git.js";
export type { CommitInfo } from "./utils/git.js";
export { getPackageJson, savePackageJson } from "./utils/package.js";
export { exec, execQuiet } from "./utils/shell.js";
export { bumpVersion } from "./utils/version.js";
