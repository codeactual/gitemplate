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
    require.register("component-escape-regexp/index.js", function(exports, require, module) {
        module.exports = function(str) {
            return String(str).replace(/([.*+?=^!:${}()|[\]\/\\])/g, "\\$1");
        };
    });
    require.register("component-indexof/index.js", function(exports, require, module) {
        var indexOf = [].indexOf;
        module.exports = function(arr, obj) {
            if (indexOf) return arr.indexOf(obj);
            for (var i = 0; i < arr.length; ++i) {
                if (arr[i] === obj) return i;
            }
            return -1;
        };
    });
    require.register("component-emitter/index.js", function(exports, require, module) {
        var index = require("indexof");
        module.exports = Emitter;
        function Emitter(obj) {
            if (obj) return mixin(obj);
        }
        function mixin(obj) {
            for (var key in Emitter.prototype) {
                obj[key] = Emitter.prototype[key];
            }
            return obj;
        }
        Emitter.prototype.on = function(event, fn) {
            this._callbacks = this._callbacks || {};
            (this._callbacks[event] = this._callbacks[event] || []).push(fn);
            return this;
        };
        Emitter.prototype.once = function(event, fn) {
            var self = this;
            this._callbacks = this._callbacks || {};
            function on() {
                self.off(event, on);
                fn.apply(this, arguments);
            }
            fn._off = on;
            this.on(event, on);
            return this;
        };
        Emitter.prototype.off = Emitter.prototype.removeListener = Emitter.prototype.removeAllListeners = function(event, fn) {
            this._callbacks = this._callbacks || {};
            if (0 == arguments.length) {
                this._callbacks = {};
                return this;
            }
            var callbacks = this._callbacks[event];
            if (!callbacks) return this;
            if (1 == arguments.length) {
                delete this._callbacks[event];
                return this;
            }
            var i = index(callbacks, fn._off || fn);
            if (~i) callbacks.splice(i, 1);
            return this;
        };
        Emitter.prototype.emit = function(event) {
            this._callbacks = this._callbacks || {};
            var args = [].slice.call(arguments, 1), callbacks = this._callbacks[event];
            if (callbacks) {
                callbacks = callbacks.slice(0);
                for (var i = 0, len = callbacks.length; i < len; ++i) {
                    callbacks[i].apply(this, args);
                }
            }
            return this;
        };
        Emitter.prototype.listeners = function(event) {
            this._callbacks = this._callbacks || {};
            return this._callbacks[event] || [];
        };
        Emitter.prototype.hasListeners = function(event) {
            return !!this.listeners(event).length;
        };
    });
    require.register("codeactual-outer-shelljs/index.js", function(exports, require, module) {
        "use strict";
        module.exports = {
            OuterShelljs: OuterShelljs,
            create: create,
            require: require
        };
        var emitter = require("emitter");
        function OuterShelljs(shelljs) {
            this.shelljs = shelljs;
        }
        emitter(OuterShelljs.prototype);
        OuterShelljs.prototype.findByRegex = function(parent, regex) {
            return this._("find", parent).filter(function(file) {
                return file.match(regex);
            });
        };
        OuterShelljs.prototype._ = function(method) {
            var args = [].slice.call(arguments, 1);
            var res = this.shelljs[method].apply(this.shelljs, args);
            var eventArgs = [ "cmd", method, args, res ];
            this.emit.apply(this, eventArgs);
            eventArgs = [ "cmd:" + method, args, res ];
            this.emit.apply(this, eventArgs);
            return res;
        };
        function create(shelljs) {
            return new OuterShelljs(shelljs);
        }
    });
    require.register("gitemplate/index.js", function(exports, require, module) {
        "use strict";
        module.exports = {
            Gitemplate: Gitemplate,
            mixin: mixin,
            require: require
        };
        var configurable = require("configurable.js");
        var escapeRe = require("escape-regexp");
        var util;
        var sprintf;
        var shelljs;
        var defShellOpt = {
            silent: true
        };
        function Gitemplate() {
            this.settings = {
                name: "",
                desc: "",
                json: {},
                repo: "",
                year: new Date().getUTCFullYear(),
                originSha: "",
                originUrl: ""
            };
        }
        configurable(Gitemplate.prototype);
        Gitemplate.prototype.init = function() {
            var nativeRequire = this.get("nativeRequire");
            util = nativeRequire("util");
            sprintf = util.format;
            shelljs = require("outer-shelljs").create(nativeRequire("shelljs"));
            if (this.get("verbose")) {
                defShellOpt.silent = false;
            }
            if (!defShellOpt.silent) {
                shelljs.on("cmd", this.onShellCmd);
            }
        };
        Gitemplate.prototype.onShellCmd = function(method, args, ret) {
            util.debug(sprintf("[%s] %s(%s)", new Date().toUTCString(), method, JSON.stringify(args)));
        };
        Gitemplate.prototype.cloneRepo = function() {
            var dst = this.get("dst");
            if (shelljs._("test", "-e", dst)) {
                return {
                    code: 1,
                    output: "Destination already exists"
                };
            }
            return shelljs._("exec", sprintf("git clone %s %s", this.get("src"), dst), defShellOpt);
        };
        Gitemplate.prototype.rmGitDir = function() {
            shelljs._("rm", "-rf", this.get("dst") + "/.git");
        };
        Gitemplate.prototype.replaceContentVars = function() {
            var cmdHead = "find %s -type f -exec perl -p -i -e 's/";
            var cmdFoot = "/%s/gi' {} \\;";
            var dst = this.get("dst");
            var passThruKeys = [ "name", "desc", "repo", "year", "originSha", "originUrl" ];
            var res = {
                code: 0
            };
            var self = this;
            passThruKeys.forEach(function(key) {
                if (res.code !== 0) {
                    return;
                }
                res = shelljs._("exec", sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(self.get(key))), defShellOpt);
            });
            if (res.code !== 0) {
                return res;
            }
            var json = this.get("json");
            Object.keys(json).forEach(function(key) {
                res = shelljs._("exec", sprintf(cmdHead + ESC_TMPL_VAR(key) + cmdFoot, dst, escapeRe(json[key])), defShellOpt);
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
            function mvNameVar(target) {
                shelljs._("mv", target, target.replace(nameVar, name));
            }
            var targets = shelljs._("find", dst).filter(function(file) {
                return shelljs._("test", "-d", file) && file.match(nameVar);
            });
            targets.forEach(mvNameVar);
            targets = shelljs._("find", dst).filter(function(file) {
                return shelljs._("test", "-f", file) && file.match(nameVar);
            });
            targets.forEach(mvNameVar);
            var json = this.get("json");
            var jsonKeys = Object.keys(json);
            jsonKeys.forEach(function(key) {
                var escapedKey = ESC_TMPL_VAR(key);
                function mvJsonVar(target) {
                    shelljs._("mv", target, target.replace(TMPL_VAR(key), json[key]));
                }
                var targets = shelljs._("find", dst).filter(function(file) {
                    return shelljs._("test", "-d", file) && file.match(escapedKey);
                });
                targets.forEach(mvJsonVar);
            });
            jsonKeys.forEach(function(key) {
                var escapedKey = ESC_TMPL_VAR(key);
                function mvJsonVar(target) {
                    shelljs._("mv", target, target.replace(TMPL_VAR(key), json[key]));
                }
                var targets = shelljs._("find", dst).filter(function(file) {
                    return shelljs._("test", "-f", file) && file.match(escapedKey);
                });
                targets.forEach(mvJsonVar);
            });
        };
        Gitemplate.prototype.initRepo = function() {
            shelljs._("cd", this.get("dst"));
            return shelljs._("exec", "git init", defShellOpt);
        };
        Gitemplate.prototype.setGithubOrigin = function() {
            shelljs._("cd", this.get("dst"));
            return shelljs._("exec", sprintf("git remote add origin git@github.com:%s.git", this.get("repo")), defShellOpt);
        };
        Gitemplate.prototype.getRepoOriginSha = function() {
            shelljs._("cd", this.get("dst"));
            return shelljs._("exec", "git rev-parse HEAD", defShellOpt).output.slice(0, 10);
        };
        Gitemplate.prototype.getRepoOriginUrl = function() {
            shelljs._("cd", this.get("dst"));
            return shelljs._("exec", "git remote show origin", defShellOpt).output.match(/Fetch\s+URL: (\S+)/)[1];
        };
        Gitemplate.prototype.getRepoOriginSha = function() {
            shelljs._("cd", this.get("dst"));
            return shelljs._("exec", "git rev-parse HEAD", defShellOpt).output.slice(0, 10);
        };
        Gitemplate.prototype.runPostReplace = function() {
            var dst = this.get("dst");
            var script = dst + "/.gitemplate.postreplace";
            if (!shelljs._("test", "-e", script)) {
                return;
            }
            shelljs._("cd", dst);
            var res = shelljs._("exec", script, defShellOpt);
            if (res.code === 0) {
                shelljs._("rm", "-f", script);
            }
            return res;
        };
        function mixin(ext) {
            Object.keys(ext).forEach(function(key) {
                if (typeof ext[key] === "function") {
                    Gitemplate.prototype[key] = ext[key];
                }
            });
        }
        function TMPL_VAR(key) {
            return "gitemplate_" + key;
        }
        function ESC_TMPL_VAR(key) {
            return escapeRe(TMPL_VAR(key));
        }
    });
    require.alias("visionmedia-configurable.js/index.js", "gitemplate/deps/configurable.js/index.js");
    require.alias("component-escape-regexp/index.js", "gitemplate/deps/escape-regexp/index.js");
    require.alias("codeactual-outer-shelljs/index.js", "gitemplate/deps/outer-shelljs/index.js");
    require.alias("component-emitter/index.js", "codeactual-outer-shelljs/deps/emitter/index.js");
    require.alias("component-indexof/index.js", "component-emitter/deps/indexof/index.js");
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