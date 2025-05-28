import type {
  AnalysisResult,
  MarkdownConfig,
  ReleaseStepResult,
} from "../types.js";
import { formatReleaseNotes } from "../utils/formatting.js";
import { getRepositoryInfo } from "./repository-utils.js";

/**
 * Create GitHub release with type-safe markdown configuration
 */
export async function createGithubRelease<TSections extends string = string>(
  analysis: AnalysisResult,
  dryRun = false,
  skipAuth = false,
  markdownConfig?: MarkdownConfig<TSections>
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const tag = `v${analysis.version}`;

  // Get repository info from git remote or environment
  const repoInfo = getRepositoryInfo();
  const repository =
    process.env.GITHUB_REPOSITORY || repoInfo?.fullName || "unknown";
  const repoForLinks = repoInfo
    ? { owner: repoInfo.owner, repo: repoInfo.repo }
    : undefined;

  const releaseNotes = formatReleaseNotes(
    analysis.changes,
    markdownConfig,
    analysis.commitMeta,
    repoForLinks
  );

  // Skip authentication checks if skipAuth is true and we're in dry-run mode
  let authValidation = { valid: false, error: "" };

  if (!skipAuth) {
    // Check for GitHub token (both in dry-run and real run)
    if (!process.env.GITHUB_TOKEN) {
      throw new Error(
        "GITHUB_TOKEN environment variable is required for GitHub releases"
      );
    }

    if (repository === "unknown") {
      throw new Error(
        "Could not determine repository. Set GITHUB_REPOSITORY environment variable or ensure git remote origin is set."
      );
    }

    // Validate GitHub authentication
    try {
      const response = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
        },
      });

      if (response.ok) {
        authValidation = { valid: true, error: "" };
      } else {
        authValidation = {
          valid: false,
          error: `GitHub API authentication failed: ${response.status} ${response.statusText}`,
        };
        throw new Error(authValidation.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      authValidation = {
        valid: false,
        error: `GitHub authentication failed: ${errorMessage}`,
      };
      throw new Error(authValidation.error);
    }
  } else if (dryRun) {
    // In dry-run with skipAuth, mark as skipped
    authValidation = { valid: false, error: "Skipped (--skip-github)" };

    // For dry-run preview, we can still show repository info even without auth
    if (repository === "unknown") {
      // Try to get repo info without requiring GITHUB_REPOSITORY env var
      const fallbackRepo = repoInfo?.fullName || "unknown/unknown";
      return {
        success: true,
        dryRun,
        version: analysis.version,
        tag,
        name: tag,
        prerelease: analysis.isPrerelease || false,
        releaseNotes,
        repository: fallbackRepo,
        authValidation,
        skipped: true,
      };
    }
  }

  if (!dryRun) {
    const releaseData = {
      tag_name: tag,
      name: tag,
      body: releaseNotes,
      prerelease: analysis.isPrerelease || false,
    };

    const response = await fetch(
      `https://api.github.com/repos/${repository}/releases`,
      {
        method: "POST",
        headers: {
          Authorization: `token ${process.env.GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(releaseData),
      }
    );

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    const release = await response.json();
    return {
      success: true,
      dryRun,
      version: analysis.version,
      tag,
      url: release.html_url,
      releaseNotes,
      repository,
      authValidation,
    };
  }

  return {
    success: true,
    dryRun,
    version: analysis.version,
    tag,
    name: tag,
    prerelease: analysis.isPrerelease || false,
    releaseNotes,
    repository,
    authValidation,
    skipped: skipAuth && dryRun,
  };
}
