// Formatting utilities for changelogs and release notes

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
