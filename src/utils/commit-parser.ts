import type { CommitAnalysisResult, Config, ParsedCommit } from "../types.js";
import type { CommitInfo } from "./git.js";

// Commit parsing and analysis utilities

/**
 * Parse a conventional commit message
 */
export function parseCommit(message: string, hash?: string): ParsedCommit {
  // Extract PR number from commit message (GitHub squash merge format)
  const prMatch = message.match(/\(#(\d+)\)$/);
  const prNumber = prMatch ? prMatch[1] : undefined;

  // Clean the message by removing the PR number for parsing
  const cleanMessage = prNumber ? message.replace(/\s*\(#\d+\)$/, "") : message;

  // Parse conventional commit format: type(scope): description
  const match = cleanMessage.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);

  if (!match) {
    return {
      type: "unknown",
      description: cleanMessage,
      breaking: false,
      body: "",
      hash,
      prNumber,
    };
  }

  const [, type, scope, description] = match;

  return {
    type: type || "unknown",
    scope,
    description: description || "",
    breaking: false, // Will be determined by keywords later
    body: "",
    hash,
    prNumber,
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

/**
 * Analyze commits and categorize them based on configuration
 */
export function analyzeCommits(
  commits: CommitInfo[],
  config: Config,
  breakingKeywords: string[] = []
): CommitAnalysisResult & {
  commitMeta: Record<string, { hash?: string; prNumber?: string }>;
} {
  const changes: Record<string, string[]> = {};
  const commitMeta: Record<string, { hash?: string; prNumber?: string }> = {};
  let bump: "major" | "minor" | "patch" = "patch";
  let hasVisibleChanges = false;

  for (const commitInfo of commits) {
    const parsed = parseCommit(commitInfo.message, commitInfo.hash);

    // Check for breaking changes
    const isBreaking = breakingKeywords.some((keyword) =>
      commitInfo.message.includes(keyword)
    );

    if (isBreaking) {
      parsed.breaking = true;
      bump = "major";
    }

    // Get commit type configuration
    const typeConfig = config.types[parsed.type];

    if (!typeConfig) {
      // Unknown commit type - treat as patch
      continue;
    }

    // Update bump level
    if (typeConfig.bump === "minor" && bump !== "major") {
      bump = "minor";
    }

    // Skip hidden types for changelog
    if (typeConfig.hidden) {
      continue;
    }

    // Check if this commit should be hidden based on scope
    const hiddenScopes = config.hiddenScopes[parsed.type];
    if (hiddenScopes && parsed.scope && hiddenScopes.includes(parsed.scope)) {
      continue;
    }

    hasVisibleChanges = true;

    // Add to appropriate section
    const section = isBreaking
      ? "Breaking Changes"
      : typeConfig.section || parsed.type;

    if (!changes[section]) {
      changes[section] = [];
    }

    const changeDescription = parsed.scope
      ? `${parsed.description} (${parsed.scope})`
      : parsed.description;

    changes[section].push(changeDescription);

    // Store commit metadata for linking
    commitMeta[changeDescription] = {
      hash: parsed.hash,
      prNumber: parsed.prNumber,
    };
  }

  return {
    bump,
    changes,
    hasOnlyHiddenChanges: !hasVisibleChanges,
    commitMeta,
  };
}
