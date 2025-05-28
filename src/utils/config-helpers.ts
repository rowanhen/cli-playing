import type { CommitTypeConfig, Config } from "../types.js";

/**
 * Configuration utility functions for working with commit types and sections
 */

// Helper to validate that a string is a valid commit type from a config
export function isValidCommitType<T extends Record<string, CommitTypeConfig>>(
  type: string,
  config: Config<T>
): type is keyof T & string {
  return type in config.types;
}

// Helper to get all valid commit types from a config
export function getValidCommitTypes<T extends Record<string, CommitTypeConfig>>(
  config: Config<T>
): (keyof T)[] {
  return Object.keys(config.types);
}

// Helper to get all section names from a config
export function getValidSectionNames<
  T extends Record<string, CommitTypeConfig>
>(config: Config<T>): string[] {
  const sections: string[] = [];
  for (const typeConfig of Object.values(config.types)) {
    if ("section" in typeConfig && typeConfig.section) {
      sections.push(typeConfig.section);
    }
  }
  return sections;
}
