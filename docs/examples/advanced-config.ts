import type {
  CommitTypeConfig,
  Config,
} from "@super-secret-test-org/simple-versioning";

// Define your commit types - this becomes the single source of truth
const COMMIT_TYPES = {
  feat: { bump: "minor", section: "Features" },
  fix: { bump: "patch", section: "Bug Fixes" },
  docs: { bump: "patch", section: "Documentation" },
  style: { bump: "patch", section: "Styles" },
  refactor: { bump: "patch", section: "Refactors" },
  perf: { bump: "patch", section: "Performance Improvements" },
  test: { bump: "patch", section: "Tests" },
  chore: { bump: "patch", section: "Chores" },
  // Hidden types - trigger releases but don't appear in changelog
  bump: { bump: "patch", hidden: true },
  dependabot: { bump: "patch", hidden: true },
} as const satisfies Record<string, CommitTypeConfig>;

export const config: Config<typeof COMMIT_TYPES> = {
  types: COMMIT_TYPES,

  // Type-safe: only commit types from COMMIT_TYPES are allowed
  hiddenScopes: {
    chore: ["npm-dep", "deps"],
    docs: ["readme"],
  },

  breakingKeywords: [
    "BREAKING CHANGE",
    "BREAKING-CHANGE",
    "BREAKING CHANGES",
    "BREAKING-CHANGES",
  ],

  branches: {
    main: "main",
    prereleasePattern: /^(feature|fix|chore)\//,
    prereleasePrefix: "beta",
  },

  // Optional: Customize markdown formatting
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
    // Type-safe: only section names from COMMIT_TYPES are allowed
    sections: {
      Features: "🚀 Features",
      "Bug Fixes": "🐛 Bug Fixes",
      Documentation: "📚 Documentation",
      Styles: "💄 Styles",
      Refactors: "♻️ Refactors",
      "Performance Improvements": "⚡ Performance",
      Tests: "✅ Tests",
      Chores: "🔧 Chores",
      "Breaking Changes": "💥 BREAKING CHANGES",
    },
  },
};
