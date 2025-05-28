import { CONFIG } from "../config.js";
import { exec, execQuiet } from "./shell.js";

// Git utilities

export interface CommitInfo {
  hash: string;
  message: string;
}

// Get current branch
export function getCurrentBranch(): string {
  return process.env.GITHUB_REF_NAME || exec("git rev-parse --abbrev-ref HEAD");
}

// Check if branch is allowed for releases
export function isBranchAllowed(branch: string): boolean {
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

// Get commits since last tag with hash and message
export function getCommitsWithHashesSinceLastTag(): CommitInfo[] {
  const lastTag = execQuiet("git describe --tags --abbrev=0");

  let gitLogCommand: string;
  if (lastTag) {
    // We have tags - get commits since last tag
    gitLogCommand = `git log ${lastTag}..HEAD --pretty=format:"%H|%s%n%n%b%n--END--"`;
  } else {
    // No tags yet - get all commits
    gitLogCommand = 'git log --pretty=format:"%H|%s%n%n%b%n--END--"';
  }

  return exec(gitLogCommand)
    .split("\n--END--\n")
    .filter((c: string) => c.trim())
    .map((commit: string) => {
      const lines = commit.trim().split("\n");
      const firstLine = lines[0] || "";
      const [hash, ...subjectParts] = firstLine.split("|");
      const subject = subjectParts.join("|"); // In case subject contains |
      const body = lines.slice(1).join("\n").trim();

      return {
        hash: hash || "",
        message: body ? `${subject}\n\n${body}` : subject,
      };
    })
    .filter((commit) => commit.hash && commit.message);
}

// Get commits since last tag (legacy function for backward compatibility)
export function getCommitsSinceLastTag(): string[] {
  return getCommitsWithHashesSinceLastTag().map((commit) => commit.message);
}
