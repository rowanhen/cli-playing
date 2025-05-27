import { CONFIG } from "../config.js";
import { exec, execQuiet } from "./shell.js";

// Git utilities

// Get current branch
export function getCurrentBranch(): string {
  return process.env.GITHUB_REF_NAME || exec("git rev-parse --abbrev-ref HEAD");
}

// Check if branch is allowed for releases
export function isBranchAllowed(branch: string) {
  return (
    branch === CONFIG.branches.main ||
    CONFIG.branches.prereleasePattern.test(branch)
  );
}

// Get prerelease tag from branch name
export function getPrereleaseTag(branch: string) {
  if (branch === CONFIG.branches.main) return null;
  if (!CONFIG.branches.prereleasePattern.test(branch)) return null;

  // Replace slashes with dashes and prefix
  return `${CONFIG.branches.prereleasePrefix}-${branch.replace(/\//g, "-")}`;
}

// Get commits since last tag
export function getCommitsSinceLastTag(): string[] {
  const lastTag = execQuiet("git describe --tags --abbrev=0");

  if (lastTag) {
    // We have tags - get commits since last tag
    return exec(`git log ${lastTag}..HEAD --pretty=format:"%s%n%n%b%n--END--"`)
      .split("\n--END--\n")
      .filter((c: string) => c.trim());
  } else {
    // No tags yet - get all commits
    return exec('git log --pretty=format:"%s%n%n%b%n--END--"')
      .split("\n--END--\n")
      .filter((c: string) => c.trim());
  }
}
