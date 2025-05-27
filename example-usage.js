// Example usage of the release automation package
import {
  ReleaseOrchestrator,
  analyzeCommits,
  getCommitsSinceLastTag,
} from "./dist/index.js";

async function example() {
  console.log("🔍 Example: Using Release Automation Programmatically\n");

  // Example 1: Use individual functions
  console.log("1️⃣ Using individual functions:");
  try {
    const commits = getCommitsSinceLastTag();
    console.log(`   Found ${commits.length} commits since last tag`);

    if (commits.length > 0) {
      const analysis = analyzeCommits(commits);
      console.log(`   Analysis: ${analysis.bump} bump recommended`);
      console.log(
        `   Changes: ${Object.keys(analysis.changes).join(", ") || "none"}`
      );
    }
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n2️⃣ Using the ReleaseOrchestrator class:");

  // Example 2: Use the class
  const automation = new ReleaseOrchestrator();

  try {
    // Analyze commits
    const analysis = await automation.analyzeCommits();
    console.log("   Analysis result:");
    console.log(`   - Package: ${analysis.packageName}`);
    console.log(`   - Current version: ${analysis.currentVersion}`);
    console.log(`   - Would bump to: ${analysis.version}`);
    console.log(`   - Bump type: ${analysis.bump}`);
    console.log(`   - Has changes: ${analysis.hasChanges}`);
    console.log(`   - Branch: ${analysis.branch}`);

    if (analysis.commitSubjects && analysis.commitSubjects.length > 0) {
      console.log("   - Recent commits:");
      analysis.commitSubjects.slice(0, 3).forEach((subject, i) => {
        console.log(`     ${i + 1}. ${subject}`);
      });
    }

    // Example 3: Run a dry-run release
    console.log("\n3️⃣ Running dry-run release:");
    const result = await automation.release({
      dryRun: true,
      skipNpm: true, // Skip NPM since we don't have tokens
      skipGithub: true, // Skip GitHub since we don't have tokens
    });

    console.log("   Dry-run completed successfully!");
    console.log(`   Steps executed: ${Object.keys(result.steps).join(", ")}`);
  } catch (error) {
    console.log(`   Error: ${error.message}`);
  }

  console.log("\n✅ Example completed!");
}

example().catch(console.error);
