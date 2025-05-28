import { existsSync, readFileSync, writeFileSync } from "fs";
import type {
  AnalysisResult,
  MarkdownConfig,
  ReleaseStepResult,
} from "../types.js";
import { formatChangelogEntry } from "../utils/formatting.js";
import { getRepositoryInfo } from "./repository-utils.js";

/**
 * Generate changelog entry with type-safe markdown configuration
 */
export async function generateChangelog<TSections extends string = string>(
  analysis: AnalysisResult,
  dryRun = false,
  markdownConfig?: MarkdownConfig<TSections>
): Promise<ReleaseStepResult> {
  if (analysis.error) {
    throw new Error(analysis.error);
  }

  if (!analysis.hasChanges) {
    return {
      success: true,
      dryRun,
      skipped: true,
      reason: "No visible changes to document",
    };
  }

  // Read existing changelog or create new one
  let changelog =
    "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
  if (existsSync("CHANGELOG.md")) {
    changelog = readFileSync("CHANGELOG.md", "utf8");
  }

  // Get repository info for linking
  const repoInfo = getRepositoryInfo();
  const repoForLinks = repoInfo
    ? { owner: repoInfo.owner, repo: repoInfo.repo }
    : undefined;

  // Generate new entry with custom markdown config and links
  const newEntry = formatChangelogEntry(
    analysis.version,
    analysis.changes,
    markdownConfig,
    analysis.commitMeta,
    repoForLinks
  );

  // Find the right place to insert the new entry
  const lines = changelog.split("\n");
  let insertIndex = -1;

  // Look for the first existing version entry or end of header
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // If we find an existing version entry, insert before it
    if (line?.startsWith("## [")) {
      insertIndex = i;
      break;
    }

    // If we reach the end and haven't found a version entry,
    // insert after the header (after "All notable changes..." line)
    if (i === lines.length - 1) {
      // Find the last non-empty line in the header section
      for (let j = 0; j < lines.length; j++) {
        if (
          lines[j]?.trim() ===
          "All notable changes to this project will be documented in this file."
        ) {
          insertIndex = j + 2; // Insert after this line with a blank line
          break;
        }
      }
      // Fallback: insert after line 3 (header + description + blank line)
      if (insertIndex === -1) {
        insertIndex = Math.min(4, lines.length);
      }
      break;
    }
  }

  // Insert the new entry
  if (insertIndex !== -1) {
    lines.splice(insertIndex, 0, newEntry.trim(), "");
  } else {
    // Fallback: append to end
    lines.push("", newEntry.trim());
  }

  const updatedChangelog = lines.join("\n");

  if (!dryRun) {
    writeFileSync("CHANGELOG.md", updatedChangelog);
  }

  return {
    success: true,
    dryRun,
    version: analysis.version,
    sections: Object.keys(analysis.changes),
    changelogEntry: newEntry.trim(),
    changelogPreview: dryRun ? updatedChangelog : undefined,
  };
}
