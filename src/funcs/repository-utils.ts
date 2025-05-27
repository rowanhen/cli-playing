import { execSync } from "child_process";

/**
 * Get repository information from git remote origin
 */
export function getRepositoryInfo(): {
  owner: string;
  repo: string;
  fullName: string;
} | null {
  try {
    const remoteUrl = execSync("git remote get-url origin", {
      encoding: "utf8",
    }).trim();

    // Handle both HTTPS and SSH URLs
    let match;
    if (remoteUrl.startsWith("https://github.com/")) {
      // HTTPS: https://github.com/owner/repo.git
      match = remoteUrl.match(
        /https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?$/
      );
    } else if (remoteUrl.startsWith("git@github.com:")) {
      // SSH: git@github.com:owner/repo.git
      match = remoteUrl.match(/git@github\.com:([^\/]+)\/([^\/]+?)(?:\.git)?$/);
    }

    if (match) {
      const [, owner, repo] = match;
      return {
        owner,
        repo,
        fullName: `${owner}/${repo}`,
      };
    }
  } catch (error) {
    // Ignore errors, will fall back to environment variable
  }

  return null;
}
