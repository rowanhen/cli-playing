# Automatic Links

Simple Versioning automatically generates links to GitHub PRs and commits in changelogs and release notes.

## How It Works

The package automatically detects your GitHub repository and creates links without any configuration:

1. **Repository Detection**: Automatically detects GitHub repository from `git remote origin` or `GITHUB_REPOSITORY` environment variable
2. **PR Links**: For commits with format `feat: description (#123)`, links to the PR
3. **Commit Links**: For other commits, links directly to the commit using short hash
4. **Fallback**: No links if repository information isn't available

## Repository Detection

The package tries multiple methods to detect your repository:

### Git Remote (Automatic)

```bash
# HTTPS remote
git remote add origin https://github.com/owner/repo.git

# SSH remote
git remote add origin git@github.com:owner/repo.git
```

Both formats are automatically detected and parsed.

### Environment Variable

```bash
export GITHUB_REPOSITORY="owner/repo"
```

This is useful in CI environments like GitHub Actions where the repository is provided automatically.

## Link Generation Examples

### PR Links

When commits reference pull requests:

```bash
git commit -m "feat: add user authentication (#123)"
git commit -m "fix: resolve login issue (#124)"
```

**Generated Output:**

```markdown
### 🚀 Features

- Add user authentication ([#123](https://github.com/owner/repo/pull/123))

### 🐛 Bug Fixes

- Resolve login issue ([#124](https://github.com/owner/repo/pull/124))
```

### Commit Links

When commits don't reference PRs:

```bash
git commit -m "feat: add user authentication"
git commit -m "fix: resolve login issue"
```

**Generated Output:**

```markdown
### 🚀 Features

- Add user authentication ([a1b2c3d](https://github.com/owner/repo/commit/a1b2c3d4e5f6789))

### 🐛 Bug Fixes

- Resolve login issue ([e4f5g6h](https://github.com/owner/repo/commit/e4f5g6h7i8j9k0l))
```

## Complete Example

Here's what a full changelog entry looks like with automatic links:

```markdown
## [1.2.0] - 2025-01-15

### 🚀 Features

- Add user authentication system ([#123](https://github.com/owner/repo/pull/123))
- Implement dashboard with real-time updates ([#124](https://github.com/owner/repo/pull/124))
- Add support for custom themes ([a1b2c3d](https://github.com/owner/repo/commit/a1b2c3d4e5f6789))

### 🐛 Bug Fixes

- Fix memory leak in data processing ([#126](https://github.com/owner/repo/pull/126))
- Resolve login redirect issue ([#127](https://github.com/owner/repo/pull/127))
- Fix typo in error message ([b2c3d4e](https://github.com/owner/repo/commit/b2c3d4e5f6g7h8i))

### 💥 BREAKING CHANGES

- Redesign user API for better performance ([#128](https://github.com/owner/repo/pull/128))
```

## PR Number Detection

The package recognizes several PR number formats:

```bash
# Standard format
git commit -m "feat: add feature (#123)"

# With additional text
git commit -m "feat: add feature (#123) - with extra details"

# Multiple PRs (uses first one)
git commit -m "feat: merge features (#123, #124)"

# Squash merge format
git commit -m "feat: add feature (#123)

* commit 1
* commit 2"
```

## Commit Hash Format

Commit hashes are automatically shortened to 7 characters for readability:

- Full hash: `a1b2c3d4e5f6789012345678`
- Short hash: `a1b2c3d`
- Link: `[a1b2c3d](https://github.com/owner/repo/commit/a1b2c3d4e5f6789012345678)`

## No Configuration Required

Links are included by default without any configuration. The package:

- ✅ Automatically detects repository information
- ✅ Generates appropriate links based on commit format
- ✅ Falls back gracefully when repository info isn't available
- ✅ Works in both local development and CI environments

## Troubleshooting

### No Links Generated

If links aren't appearing, check:

1. **Git remote**: `git remote -v` should show a GitHub URL
2. **Environment variable**: Set `GITHUB_REPOSITORY=owner/repo`
3. **Repository format**: Must be a GitHub repository

### Wrong Repository

If links point to the wrong repository:

1. **Check git remote**: `git remote get-url origin`
2. **Override with environment**: `GITHUB_REPOSITORY=correct/repo`

### Links in CI

For GitHub Actions, the repository is automatically available:

```yaml
env:
  GITHUB_REPOSITORY: ${{ github.repository }}
```

For other CI systems, set the environment variable manually:

```yaml
env:
  GITHUB_REPOSITORY: "owner/repo"
```
