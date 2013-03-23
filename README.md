# gitemplate

Create a new Git repo from a templates in an existing repo.

* Built-in/custom macros for both file names and content.
* Optional GitHub repo init and remote origin setup.

[![Build Status](https://travis-ci.org/codeactual/gitemplate.png)](https://travis-ci.org/codeactual/gitemplate)

## Example

    $ gitemplate --name my-new-project \
                 --json '{"customMacro1":"val1","customMacro2":"val2"}' \
                 --src git@github.com:me/my-old-template.git \
                 --dst ~/dev/my-new-project \
                 --repo me/my-new-project
    $ ls -a
    $ .  ..  bin  .git  .gitignore  index.json LICENSE  package.json  README.md  test.js

## Built-in macros

### `{{gitemplate.name}}`

> Same as `--name`.

### `{{gitemplate.year}}`

> Full year in local time.

## Custom macro

### Example file content

{{gitemplate.engineVer}}

## Example CLI flag

    --json '{"engineVer":"0.10.1"}'

## Installation

### [Component](https://github.com/component/component)

Install to `components/`:

    $ component install codeactual/gitemplate

Build new standalone file:

    $ grunt dist

## API

### Example

```js
this.gt = new Gitemplate();
this.gt
  .set('name', this.name)
  .set('src', this.src)
  .set('dst', this.dst)
  .set('json', this.json)
  .set('repo', this.repo)
  .set('nativeRequire', require).init();
this.gt.cloneRepo();
```

### #cloneRepo()

> `git clone` wrapper.

### #rmGitDir()

> Prep for new init and remote origin.

### #expandContentMacros()

> Expand macros found in repo file content.

### #expandNameMacros()

> Expand macros found in repo file names.

### #init()

> Apply collected configuration.

### #initRepo()

> `git init` wrapper.

### #setGithubOrigin()

> Set GitHub remote origin.

## License

  MIT

## Tests

    npm install --devDependencies
    npm test

## Change Log

### 0.1.0

* Initial API to support: `--name`, `--src`, `--dst`, `--repo`, `--json`.
