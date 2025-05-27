import { CONFIG } from "../config.js";
import type { CommitAnalysisResult, ParsedCommit } from "../types.js";

// Commit parsing and analysis utilities

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
