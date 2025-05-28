import type { CommitTypeConfig, Config } from "./types.js";

// Define the commit types configuration with proper typing
const COMMIT_TYPES = {
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
} as const satisfies Record<string, CommitTypeConfig>;

// Shared configuration with improved type safety
export const CONFIG: Config<typeof COMMIT_TYPES> = {
  types: COMMIT_TYPES,
  // Type-safe: only keys from COMMIT_TYPES are allowed
  hiddenScopes: {
    chore: ["npm-dep"],
    // TypeScript will error if you try to add a scope for a non-existent type
    // invalidType: ["scope"], // ❌ This would cause a TypeScript error
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
  // Markdown formatting configuration with type-safe sections
  markdown: {
    changelog: {
      versionHeader: "## [{version}] - {date}",
      sectionHeader: "### {section}",
      listItem: "- {item}",
      dateFormat: "YYYY-MM-DD",
    },
    releaseNotes: {
      sectionHeader: "### {section}",
      listItem: "- {item}",
    },
    // Type-safe: only section names from COMMIT_TYPES or "Breaking Changes" are allowed
    sections: {
      Features: "🚀 Features", // ✅ Valid - "Features" is defined in feat type
      "Bug Fixes": "🐛 Bug Fixes", // ✅ Valid - "Bug Fixes" is defined in fix type
      "Performance Improvements": "🏎️ Performance Improvements", // ✅ Valid - "Performance Improvements" is defined in perf type
      Styles: "🎨 Styles", // ✅ Valid - "Styles" is defined in style type
      Refactors: "🔄 Refactors", // ✅ Valid - "Refactors" is defined in refactor type
      Documentation: "📚 Documentation", // ✅ Valid - "Documentation" is defined in docs type
      "Breaking Changes": "💥 BREAKING CHANGES", // ✅ Valid - always allowed
      Chores: "🧹 Chores", // ✅ Valid - "Chore" is defined in chore type
      // "Invalid Section": "❌ Invalid", // ❌ This would cause a TypeScript error
    },
  },
};
