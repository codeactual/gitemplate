(function() {
    function require(path, parent, orig) {
        var resolved = require.resolve(path);
        if (null == resolved) {
            orig = orig || path;
            parent = parent || "root";
            var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
            err.path = orig;
            err.parent = parent;
            err.require = true;
            throw err;
        }
        var module = require.modules[resolved];
        if (!module.exports) {
            module.exports = {};
            module.client = module.component = true;
            module.call(this, module.exports, require.relative(resolved), module);
        }
        return module.exports;
    }
    require.modules = {};
    require.aliases = {};
    require.resolve = function(path) {
        if (path.charAt(0) === "/") path = path.slice(1);
        var index = path + "/index.js";
        var paths = [ path, path + ".js", path + ".json", path + "/index.js", path + "/index.json" ];
        for (var i = 0; i < paths.length; i++) {
            var path = paths[i];
            if (require.modules.hasOwnProperty(path)) return path;
        }
        if (require.aliases.hasOwnProperty(index)) {
            return require.aliases[index];
        }
    };
    require.normalize = function(curr, path) {
        var segs = [];
        if ("." != path.charAt(0)) return path;
        curr = curr.split("/");
        path = path.split("/");
        for (var i = 0; i < path.length; ++i) {
            if (".." == path[i]) {
                curr.pop();
            } else if ("." != path[i] && "" != path[i]) {
                segs.push(path[i]);
            }
        }
        return curr.concat(segs).join("/");
    };
    require.register = function(path, definition) {
        require.modules[path] = definition;
    };
    require.alias = function(from, to) {
        if (!require.modules.hasOwnProperty(from)) {
            throw new Error('Failed to alias "' + from + '", it does not exist');
        }
        require.aliases[to] = from;
    };
    require.relative = function(parent) {
        var p = require.normalize(parent, "..");
        function lastIndexOf(arr, obj) {
            var i = arr.length;
            while (i--) {
                if (arr[i] === obj) return i;
            }
            return -1;
        }
        function localRequire(path) {
            var resolved = localRequire.resolve(path);
            return require(resolved, parent, path);
        }
        localRequire.resolve = function(path) {
            var c = path.charAt(0);
            if ("/" == c) return path.slice(1);
            if ("." == c) return require.normalize(p, path);
            var segs = parent.split("/");
            var i = lastIndexOf(segs, "deps") + 1;
            if (!i) i = 0;
            path = segs.slice(0, i + 1).join("/") + "/deps/" + path;
            return path;
        };
        localRequire.exists = function(path) {
            return require.modules.hasOwnProperty(localRequire.resolve(path));
        };
        return localRequire;
    };
    require.register("visionmedia-configurable.js/index.js", function(exports, require, module) {
        module.exports = function(obj) {
            obj.settings = {};
            obj.set = function(name, val) {
                if (1 == arguments.length) {
                    for (var key in name) {
                        this.set(key, name[key]);
                    }
                } else {
                    this.settings[name] = val;
                }
                return this;
            };
            obj.get = function(name) {
                return this.settings[name];
            };
            obj.enable = function(name) {
                return this.set(name, true);
            };
            obj.disable = function(name) {
                return this.set(name, false);
            };
            obj.enabled = function(name) {
                return !!this.get(name);
            };
            obj.disabled = function(name) {
                return !this.get(name);
            };
            return obj;
        };
    });
    require.register("gitemplate/index.js", function(exports, require, module) {
        "use strict";
        module.exports = {
            Gitemplate: Gitemplate,
            require: require
        };
        var configurable = require("configurable.js");
        var sprintf;
        var shelljs;
        var defShellOpt = {
            silent: true
        };
        function Gitemplate() {
            this.settings = {
                name: null,
                json: {},
                repo: null
            };
        }
        configurable(Gitemplate.prototype);
        Gitemplate.prototype.init = function() {
            var nativeRequire = this.get("nativeRequire");
            shelljs = nativeRequire("shelljs");
            sprintf = nativeRequire("util").format;
        };
        Gitemplate.prototype.cloneRepo = function() {
            return shelljs.exec(sprintf("git clone %s %s", this.get("src"), this.get("dst")), defShellOpt);
        };
        Gitemplate.prototype.rmGitDir = function() {
            shelljs.rm("-rf", this.get("dst") + "/.git");
        };
        Gitemplate.prototype.replaceContentVars = function() {
            var cmdHead = "find %s -type f -exec perl -p -i -e 's/\\{\\{";
            var cmdFoot = "\\}\\}/%s/g' {} \\;";
            var dst = this.get("dst");
            var res = shelljs.exec(sprintf(cmdHead + ESC_TMPL_VAR("name") + cmdFoot, dst, this.get("name")), defShellOpt);
            if (res.code !== 0) {
                return res;
            }
            res = shelljs.exec(sprintf(cmdHead + ESC_TMPL_VAR("year") + cmdFoot, dst, new Date().getFullYear()), defShellOpt);
            if (res.code !== 0) {
                return res;
            }
            var repo = this.get("repo");
            if (repo) {
                res = shelljs.exec(sprintf(cmdHead + ESC_TMPL_VAR("repo") + cmdFoot, dst, repo.replace("/", "\\/")), defShellOpt);
                if (res.code !== 0) {
                    return res;
                }
            }
            var json = this.get("json");
            Object.keys(json).forEach(function(key) {
                res = shelljs.exec(sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, json[key]), defShellOpt);
                if (res.code !== 0) {
                    return res;
                }
            });
            return res;
        };
        Gitemplate.prototype.replaceNameVars = function() {
            var name = this.get("name");
            var dst = this.get("dst");
            var nameVar = TMPL_VAR("name");
            var targets = shelljs.find(dst).filter(function(file) {
                return file.match(nameVar);
            });
            targets.forEach(function(target) {
                shelljs.mv(target, target.replace(nameVar, name));
            });
            var json = this.get("json");
            console.error("json", json);
            Object.keys(json).forEach(function(key) {
                var targets = shelljs.find(dst).filter(function(file) {
                    return file.match(ESC_TMPL_VAR(key));
                });
                console.error("targets", targets);
                targets.forEach(function(target) {
                    console.error(target, target.replace(TMPL_VAR(key), json[key]));
                    shelljs.mv(target, target.replace(TMPL_VAR(key), json[key]));
                });
            });
        };
        Gitemplate.prototype.initRepo = function() {
            shelljs.cd(this.get("dst"));
            return shelljs.exec("git init", defShellOpt);
        };
        Gitemplate.prototype.setGithubOrigin = function() {
            shelljs.cd(this.get("dst"));
            return shelljs.exec(sprintf("git remote add origin git@github.com:%s.git", this.get("repo")), defShellOpt);
        };
        function TMPL_VAR(key) {
            return "gitemplate." + key;
        }
        function ESC_TMPL_VAR(key) {
            return TMPL_VAR(key).replace(/\./, "\\.");
        }
    });
    require.alias("visionmedia-configurable.js/index.js", "gitemplate/deps/configurable.js/index.js");
    if (typeof exports == "object") {
        module.exports = require("gitemplate");
    } else if (typeof define == "function" && define.amd) {
        define(function() {
            return require("gitemplate");
        });
    } else {
        window["gitemplate"] = require("gitemplate");
    }
})();