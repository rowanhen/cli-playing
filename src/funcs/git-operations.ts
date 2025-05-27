import { existsSync } from "fs";
import type { AnalysisResult, ReleaseStepResult } from "../types.js";
import { exec } from "../utils/shell.js";

/**
 * Commit changes to git
 */
export async function commitChanges(
  analysis: AnalysisResult,
  dryRun = false
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const message = `chore(release): ${analysis.version} [skip ci]`;
  const filesToCommit = ["package.json"];

  // Add changelog if it exists and has changes
  if (analysis.hasChanges && existsSync("CHANGELOG.md")) {
    filesToCommit.push("CHANGELOG.md");
  }

  // Add package-lock.json if it exists
  if (existsSync("package-lock.json")) {
    filesToCommit.push("package-lock.json");
  }

  if (!dryRun) {
    // Stage files
    for (const file of filesToCommit) {
      if (existsSync(file)) {
        exec(`git add ${file}`);
      }
    }

    // Commit
    exec(`git commit -m "${message}"`);
  }

  return {
    success: true,
    dryRun,
    message,
    files: filesToCommit,
  };
}

/**
 * Create git tag
 */
export async function createTag(
  analysis: AnalysisResult,
  dryRun = false
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  const tag = `v${analysis.version}`;
  const tagMessage = `Release ${analysis.version}`;

  if (!dryRun) {
    exec(`git tag -a ${tag} -m "${tagMessage}"`);
  }

  return {
    success: true,
    dryRun,
    tag,
    version: analysis.version,
    tagMessage,
    gitCommand: `git tag -a ${tag} -m "${tagMessage}"`,
    isPrerelease: analysis.isPrerelease || false,
  };
}

/**
 * Push changes and tags to remote
 */
export function pushChanges(dryRun = false): void {
  if (!dryRun) {
    exec("git push origin HEAD --follow-tags");
  }
}
