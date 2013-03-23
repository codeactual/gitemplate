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
        var fs;
        var shelljs;
        var exec;
        var util;
        var defShellOpt = {
            silent: true
        };
        var MACRO_NS = "gitemplate.";
        var MACRO_KEYS = [ "name" ];
        var MACRO = {};
        MACRO_KEYS.forEach(function(key) {
            MACRO[key] = MACRO_NS + key;
        });
        function Gitemplate() {
            this.settings = {
                name: null
            };
        }
        configurable(Gitemplate.prototype);
        Gitemplate.prototype.init = function() {
            var nativeRequire = this.get("nativeRequire");
            fs = nativeRequire("fs");
            shelljs = nativeRequire("shelljs");
            util = nativeRequire("util");
            sprintf = util.format;
        };
        Gitemplate.prototype.cloneRepo = function() {
            return shelljs.exec(sprintf("git clone %s %s", this.get("src"), this.get("dst")), defShellOpt);
        };
        Gitemplate.prototype.rmGitDir = function() {
            shelljs.rm("-rf", this.get("dst") + "/.git");
        };
        Gitemplate.prototype.expandContentMacros = function() {
            return shelljs.exec(sprintf("find %s -type f -exec perl -p -i -e 's/\\{\\{gitemplate\\.name\\}\\}/%s/g' {} \\;", this.get("dst"), this.get("name")), defShellOpt);
        };
        Gitemplate.prototype.expandNameMacros = function() {
            var name = this.get("name");
            var targets = shelljs.find(this.get("dst")).filter(function(file) {
                return file.match(MACRO.name);
            });
            for (var t = 0, target = ""; t < targets.length; t++) {
                target = targets[t];
                shelljs.mv(target, target.replace(MACRO.name, name));
            }
        };
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