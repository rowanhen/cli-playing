// Formatting utilities for changelogs and release notes
import type { MarkdownConfig } from "../types.js";

/**
 * Format date according to the specified format
 */
function formatDate(date: Date, format: string): string {
  if (format === "YYYY-MM-DD") {
    return date.toISOString().split("T")[0];
  }
  // Add more date formats as needed
  return date.toISOString().split("T")[0]; // Default to ISO format
}

/**
 * Apply section name customization with type safety
 */
function getSectionDisplayName<TSections extends string>(
  sectionName: string,
  sections: Partial<Record<TSections | "Breaking Changes", string>> = {}
): string {
  return sections[sectionName as TSections | "Breaking Changes"] || sectionName;
}

/**
 * Create links for commit and PR references
 */
function createLinks(
  item: string,
  commitMeta?: { hash?: string; prNumber?: string },
  repoInfo?: { owner: string; repo: string }
): string {
  if (!commitMeta || !repoInfo) {
    return item;
  }

  const links: string[] = [];

  // Add PR link if available
  if (commitMeta.prNumber) {
    links.push(
      `[#${commitMeta.prNumber}](https://github.com/${repoInfo.owner}/${repoInfo.repo}/pull/${commitMeta.prNumber})`
    );
  }

  // Add commit link if available and no PR link (to avoid redundancy)
  if (commitMeta.hash && !commitMeta.prNumber) {
    const shortHash = commitMeta.hash.substring(0, 7);
    links.push(
      `[${shortHash}](https://github.com/${repoInfo.owner}/${repoInfo.repo}/commit/${commitMeta.hash})`
    );
  }

  if (links.length > 0) {
    return `${item} (${links.join(", ")})`;
  }

  return item;
}

/**
 * Format changelog entry with configurable templates and type safety
 */
export function formatChangelogEntry<TSections extends string = string>(
  version: string,
  changes: Record<string, string[]>,
  markdownConfig?: MarkdownConfig<TSections>,
  commitMeta?: Record<string, { hash?: string; prNumber?: string }>,
  repoInfo?: { owner: string; repo: string }
) {
  const config = markdownConfig?.changelog || {
    versionHeader: "## [{version}] - {date}",
    sectionHeader: "### {section}",
    listItem: "- {item}",
    dateFormat: "YYYY-MM-DD",
  };

  const date = formatDate(new Date(), config.dateFormat);
  let entry =
    config.versionHeader.replace("{version}", version).replace("{date}", date) +
    "\n\n";

  for (const [section, items] of Object.entries(changes)) {
    const displaySection = getSectionDisplayName(
      section,
      markdownConfig?.sections
    );
    entry += config.sectionHeader.replace("{section}", displaySection) + "\n\n";

    for (const item of items) {
      const itemWithLinks = createLinks(item, commitMeta?.[item], repoInfo);
      entry += config.listItem.replace("{item}", itemWithLinks) + "\n";
    }
    entry += "\n";
  }

  return entry;
}

/**
 * Format GitHub release notes with configurable templates and type safety
 */
export function formatReleaseNotes<TSections extends string = string>(
  changes: Record<string, string[]>,
  markdownConfig?: MarkdownConfig<TSections>,
  commitMeta?: Record<string, { hash?: string; prNumber?: string }>,
  repoInfo?: { owner: string; repo: string }
) {
  const config = markdownConfig?.releaseNotes || {
    sectionHeader: "### {section}",
    listItem: "- {item}",
  };

  let body = "";
  for (const [section, items] of Object.entries(changes)) {
    const displaySection = getSectionDisplayName(
      section,
      markdownConfig?.sections
    );
    body += config.sectionHeader.replace("{section}", displaySection) + "\n\n";

    for (const item of items) {
      const itemWithLinks = createLinks(item, commitMeta?.[item], repoInfo);
      body += config.listItem.replace("{item}", itemWithLinks) + "\n";
    }
    body += "\n";
  }
  return body;
}
