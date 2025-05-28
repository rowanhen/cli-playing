#!/usr/bin/env tsx

import {
  analyzeCommitsForRelease,
  bumpPackageVersion,
  createGithubRelease,
  generateChangelog,
  publishNpm,
} from "@super-secret-test-org/simple-versioning";

async function release() {
  try {
    console.log("🔍 Analyzing commits...");

    // Analyze commits and determine version bump
    const analysis = await analyzeCommitsForRelease();

    if (analysis.error) {
      console.error("❌ Analysis failed:", analysis.error);
      process.exit(1);
    }

    if (!analysis.hasChanges) {
      console.log("ℹ️  No changes to release");
      return;
    }

    console.log(`🚀 Releasing version ${analysis.version}`);
    console.log(`📈 Bump type: ${analysis.bump}`);
    console.log(
      `📝 Changes found:`,
      Object.keys(analysis.changes).length,
      "sections"
    );

    // Update package.json version
    console.log("📦 Updating package version...");
    const versionResult = await bumpPackageVersion(analysis);
    if (versionResult.success) {
      console.log("✅ Package version updated");
    } else {
      console.error("❌ Version update failed:", versionResult.error);
    }

    // Generate changelog
    console.log("📄 Generating changelog...");
    const changelogResult = await generateChangelog(analysis);
    if (changelogResult.success) {
      console.log("✅ Changelog updated");
    } else {
      console.error("❌ Changelog generation failed:", changelogResult.error);
    }

    // Create GitHub release
    console.log("🐙 Creating GitHub release...");
    const githubResult = await createGithubRelease(analysis);
    if (githubResult.success) {
      console.log("✅ GitHub release created");
      if (githubResult.url) {
        console.log(`🔗 Release URL: ${githubResult.url}`);
      }
    } else {
      console.error("❌ GitHub release failed:", githubResult.error);
    }

    // Publish to NPM
    console.log("📦 Publishing to NPM...");
    const npmResult = await publishNpm(analysis);
    if (npmResult.success) {
      console.log("✅ Published to NPM");
    } else {
      console.error("❌ NPM publish failed:", npmResult.error);
    }

    console.log("🎉 Release completed successfully!");
  } catch (error) {
    console.error("💥 Release failed:", error);
    process.exit(1);
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

if (isDryRun) {
  console.log("🧪 Running in dry-run mode - no changes will be made");
  // You can pass dryRun: true to each function for testing
}

release();
