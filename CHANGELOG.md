# 0.3.0

## breaking

- refactor(node): Migrate to ES6 features like `let` and `const`
  - Switch to `iojs` as only build target

## non-breaking

- fix(cli): check for name/src/dst earlier before read
- fix(runPostReplace): incorrect return structure
- fix(package.json): add "files" section, remove unused "devdir-ci" section
- refactor(component): Migrate to NPM-only deps
- refactor(eslint): Migrate to eslint

# 0.2.7

- fix(files/dirs): Replace custom vars w/ case-insensitive matching

# 0.2.6

- chore(npm): Upgrade outdated deps

# 0.2.5

- fix: Merge [pull 2](https://github.com/codeactual/gitemplate/pull/2)

# 0.2.4

- chore(npm): Upgrade outdated dev dependencies

# 0.2.3

- Upgrade `apidox`, `long-con`, `impulse-bin`. `outer-shelljs`.

# 0.2.2

- Upgrade `long-con` to `0.1.2`.
- Upgrade `outer-shelljs` to `0.3.2`.

# 0.2.1

- Remove NPM shrinkwrapping.

# 0.2.0

- Fix NPM compatibility.

# 0.1.0

- Initial API to support: `--name`, `--src`, `--dst`, `--desc`, `--repo`, `--json`.
