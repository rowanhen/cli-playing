// Version bumping utilities

// Bump version
export function bumpVersion(
  currentVersion: string,
  bump: "major" | "minor" | "patch",
  prerelease: string | null
): string {
  const versionParts = currentVersion.split(".").map(Number);
  if (versionParts.length !== 3 || versionParts.some(isNaN)) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const major = versionParts[0]!;
  const minor = versionParts[1]!;
  const patch = versionParts[2]!;

  if (prerelease) {
    // Handle prerelease versions
    const prereleaseMatch = currentVersion.match(/-(.+)\.(\d+)$/);
    if (prereleaseMatch && prereleaseMatch[1] === prerelease) {
      // Increment prerelease number
      return `${major}.${minor}.${patch}-${prerelease}.${
        Number(prereleaseMatch[2]) + 1
      }`;
    }
    // New prerelease
    switch (bump) {
      case "major":
        return `${major + 1}.0.0-${prerelease}.0`;
      case "minor":
        return `${major}.${minor + 1}.0-${prerelease}.0`;
      default:
        return `${major}.${minor}.${patch + 1}-${prerelease}.0`;
    }
  }

  // Regular version bump
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}
