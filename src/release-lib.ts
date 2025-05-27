#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import type {
  CommitAnalysisResult,
  Config,
  PackageJson,
  ParsedCommit,
} from "./types.js";

// Shared configuration
export const CONFIG: Config = {
  types: {
    feat: { bump: "minor", section: "Features" },
    fix: { bump: "patch", section: "Bug Fixes" },
    docs: { bump: "patch", section: "Documentation" },
    style: { bump: "patch", section: "Styles" },
    refactor: { bump: "patch", section: "Refactors" },
    perf: { bump: "patch", section: "Performance Improvements" },
    test: { bump: "patch", section: "Tests" },
    chore: { bump: "patch", section: "Chores" },
    // Hidden types - still trigger releases but don't appear in changelog
    bump: { bump: "patch", hidden: true },
    dependabot: { bump: "patch", hidden: true },
    revert: { bump: "patch", hidden: true },
  },
  // Scopes to hide for specific types
  hiddenScopes: {
    chore: ["npm-dep"],
  },
  // Breaking change keywords
  breakingKeywords: [
    "BREAKING CHANGE",
    "BREAKING-CHANGE",
    "BREAKING CHANGES",
    "BREAKING-CHANGES",
  ],
  // Branch configuration
  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "crumbs",
  },
};

// Helper functions
export const exec = (cmd: string) => execSync(cmd, { encoding: "utf8" }).trim();
export const execQuiet = (cmd: string) => {
  try {
    return execSync(`${cmd} 2>/dev/null`, { encoding: "utf8" }).trim();
  } catch {
    return null;
  }
};
export const getPackageJson = () =>
  JSON.parse(readFileSync("package.json", "utf8"));
export const savePackageJson = (pkg: PackageJson) =>
  writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

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

// Parse conventional commit
export function parseCommit(commit: string): ParsedCommit | null {
  // Split into subject (first line) and body
  const lines = commit.trim().split("\n");
  const subject = lines[0];
  if (!subject) return null;

  const body = lines.slice(1).join("\n").trim();

  // Try to parse the subject line
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!)?: (.+)/);
  if (!match) return null;

  const [, type, scope, breakingIndicator, description] = match;
  if (!type || !description) return null;

  // Check for breaking changes in multiple places:
  // 1. Exclamation mark in subject (feat!: ...)
  // 2. Breaking change keywords in body
  // 3. PR title format: "feat: description (#123)" with breaking change in PR body
  const breaking =
    !!breakingIndicator ||
    CONFIG.breakingKeywords.some((keyword) =>
      body.toUpperCase().includes(keyword.toUpperCase())
    );

  // For squash merges, GitHub often adds PR number to subject
  // Extract clean description without PR reference
  const cleanDescription = description.replace(/\s*\(#\d+\)$/, "");

  return { type, scope, description: cleanDescription, breaking, body };
}

// Analyze commits and determine version bump
export function analyzeCommits(commits: string[]): CommitAnalysisResult {
  let bump: "major" | "minor" | "patch" | null = null;
  const changes: Record<string, string[]> = {};
  let hasHiddenChanges = false;

  for (const commit of commits) {
    // Skip release commits to prevent infinite loops
    if (isReleaseCommit(commit)) {
      continue;
    }

    const parsed = parseCommit(commit);
    if (!parsed) continue;

    // Handle breaking changes
    if (parsed.breaking) {
      bump = "major";
      changes["Breaking Changes"] = changes["Breaking Changes"] || [];
      changes["Breaking Changes"].push(parsed.description);

      // If there's a body with breaking change details, include it
      if (
        parsed.body &&
        CONFIG.breakingKeywords.some((kw) =>
          parsed.body.toUpperCase().includes(kw.toUpperCase())
        )
      ) {
        const breakingDetails = parsed.body
          .split("\n")
          .filter((line) => line.trim())
          .find((line) =>
            CONFIG.breakingKeywords.some((kw) =>
              line.toUpperCase().includes(kw.toUpperCase())
            )
          );

        if (breakingDetails) {
          const detail = breakingDetails
            .replace(/BREAKING[\s-]CHANGE[S]?:?\s*/i, "")
            .trim();
          if (detail) {
            changes["Breaking Changes"].push(`Details: ${detail}`);
          }
        }
      }
    }

    // Handle regular commit types
    const config = CONFIG.types[parsed.type];
    if (config) {
      // Update bump type
      if (!bump || (bump === "patch" && config.bump === "minor")) {
        bump = config.bump;
      }

      // Check if this commit should be hidden
      const hiddenScopes = CONFIG.hiddenScopes[parsed.type];
      const isHidden =
        config.hidden ||
        (hiddenScopes && parsed.scope && hiddenScopes.includes(parsed.scope));

      // Only add to changelog if not hidden and has section
      if (!isHidden && config.section) {
        changes[config.section] = changes[config.section] || [];
        const sectionArray = changes[config.section];
        if (sectionArray) {
          sectionArray.push(parsed.description);
        }
      } else {
        hasHiddenChanges = true;
      }
    }
  }

  return {
    bump: bump || "patch",
    changes,
    hasOnlyHiddenChanges: Object.keys(changes).length === 0 && hasHiddenChanges,
  };
}

// Helper function to identify release commits
export function isReleaseCommit(commit: string): boolean {
  const subject = commit.trim().split("\n")[0];
  if (!subject) return false;

  // Check for [skip ci] or [ci skip] patterns
  if (/\[(skip ci|ci skip)\]/i.test(subject)) {
    return true;
  }

  // Check for release commit patterns
  const releasePatterns = [
    /^chore\(release\):/,
    /^release:/,
    /^bump version/i,
    /^version bump/i,
    /^\d+\.\d+\.\d+/, // Starts with version number
  ];

  return releasePatterns.some((pattern) => pattern.test(subject));
}

// Bump version
export function bumpVersion(
  currentVersion: string,
  bump: "major" | "minor" | "patch",
  prerelease: string | null
): string {
  const versionParts = currentVersion.split(".").map(Number);
  if (versionParts.length !== 3 || versionParts.some(isNaN)) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const major = versionParts[0]!;
  const minor = versionParts[1]!;
  const patch = versionParts[2]!;

  if (prerelease) {
    // Handle prerelease versions
    const prereleaseMatch = currentVersion.match(/-(.+)\.(\d+)$/);
    if (prereleaseMatch && prereleaseMatch[1] === prerelease) {
      // Increment prerelease number
      return `${major}.${minor}.${patch}-${prerelease}.${
        Number(prereleaseMatch[2]) + 1
      }`;
    }
    // New prerelease
    switch (bump) {
      case "major":
        return `${major + 1}.0.0-${prerelease}.0`;
      case "minor":
        return `${major}.${minor + 1}.0-${prerelease}.0`;
      default:
        return `${major}.${minor}.${patch + 1}-${prerelease}.0`;
    }
  }

  // Regular version bump
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

// Format changelog entry
export function formatChangelogEntry(
  version: string,
  changes: Record<string, string[]>
) {
  const date = new Date().toISOString().split("T")[0];
  let entry = `## [${version}] - ${date}\n\n`;

  for (const [section, items] of Object.entries(changes)) {
    entry += `### ${section}\n\n`;
    for (const item of items) {
      entry += `- ${item}\n`;
    }
    entry += "\n";
  }

  return entry;
}

// Format GitHub release notes
export function formatReleaseNotes(changes: Record<string, string[]>) {
  let body = "";
  for (const [section, items] of Object.entries(changes)) {
    body += `### ${section}\n\n`;
    for (const item of items) {
      body += `- ${item}\n`;
    }
    body += "\n";
  }
  return body;
}
