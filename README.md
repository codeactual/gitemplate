# gitemplate

Git cloning with template variables.

* Replace variables in file names and content.
* Optional GitHub repo init and remote origin setup.

[![Build Status](https://travis-ci.org/codeactual/gitemplate.png)](https://travis-ci.org/codeactual/gitemplate)

## Example

### Usage

    $ gitemplate --help
    $ gitemplate --name my-new-project \
                 --json '{"customVar1":"val1","customVar2":"val2"}' \
                 --src git@github.com:me/my-old-template.git \
                 --dst ~/dev/my-new-project \
                 --desc 'gets it done' \
                 --repo me/my-new-project
    $ ls -a
    $ .  ..  .git  .gitignore  index.js  package.json  README.md  test.js val1.js val2.js

### Template Repos

[![Build Status](https://travis-ci.org/codeactual/gitemplate-node-component.png)](https://travis-ci.org/codeactual/gitemplate-node-component) [node component](https://github.com/codeactual/gitemplate-node-component)

[![Build Status](https://travis-ci.org/codeactual/gitemplate-node-bin-component.png)](https://travis-ci.org/codeactual/gitemplate-node-bin-component) [node component w/ bin script](https://github.com/codeactual/gitemplate-node-bin-component)

[![Build Status](https://travis-ci.org/codeactual/gitemplate-connect-middleware.png)](https://travis-ci.org/codeactual/gitemplate-connect-middleware) [connect middleware component](https://github.com/codeactual/gitemplate-connect-middleware)

## Built-in variables

Case-insensitive.

### `gitemplate_name`

> Same as `--name`.

### `gitemplate_desc`

> Same as `--desc`.

### `gitemplate_repo`

> Same as `--repo`.

Will also trigger `init` and `remote add origin`.

### `gitemplate_year`

> Full year in local time. (Only replaced in file content.)

### `gitemplate_originSha`

> Cloned origin's commit SHA-1 (first 10 chars). (Only replaced in file content.)

### `gitemplate_originUrl`

> Cloned origin's URL. (Only replaced in file content.)

## Custom vars

> Will also replace in file names and content. Case insensitive.

### Place in a file

    gitemplate_engineVer

### Or file name

    /path/to/gitemplate_engineVer.js

### Then replace

    --json '{"engineVer":"0.10.1"}'

## Installation

### [Component](https://github.com/component/component)

Install to `components/`:

    $ component install codeactual/gitemplate

Build new standalone file:

    $ grunt dist

## CLI

    -h, --help                              output usage information

### Required

    -n, --name <project name>               my-new-proj
    -s, --src <source repo>                 git@github.com:me/one-of-my-templates.git
    -d, --dst <destination dir>             ~/dev/my-new-proj

### Optional

    -D, --desc <project description>        gets it done
    -r, --repo <user/project>               set gitemplate.repo and auto init/remote
    -j, --json <custom template variables>  '{"k1":"v1","k2":"v2",...}'

## API

### Example

```js
this.gt = new Gitemplate();
this.gt
  .set('name', this.name)
  .set('src', this.src)
  .set('dst', this.dst)
  .set('desc', this.desc)
  .set('json', this.json)
  .set('repo', this.repo)
  .set('nativeRequire', require).init();
this.gt.cloneRepo();
```

### #cloneRepo()

> `git clone` wrapper.

### #rmGitDir()

> Prep for new init and remote origin.

### #replaceContentVars()

> Replace vars found in repo file content.

### #replaceNameVars()

> Replace vars found in repo file names.

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

* Initial API to support: `--name`, `--src`, `--dst`, `--desc`, `--repo`, `--json`.
