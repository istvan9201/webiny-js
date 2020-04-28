const fs = require("fs");
const path = require("path");
const { green } = require("chalk");
const { GetEnvVars } = require("env-cmd");
const findUp = require("find-up");
const { PluginsContainer } = require("@webiny/plugins");
const debug = require("debug")("webiny");

const projectRoot = path.dirname(findUp.sync("webiny.root.js"));

class Context {
    constructor() {
        this.paths = {
            projectRoot,
            packagesPath: this.resolve("packages")
        };

        this.config = require(path.join(projectRoot, "webiny.root.js"));
        this.projectName = this.config.projectName;
        this.plugins = new PluginsContainer();
        this.scaffoldPlugins = [];

        if (this.config.cli && this.config.cli.scaffoldPlugins) {
            // Devs may specify a plugin's name instead of writing a plugin itself (:
            const loadedPlugins = this.config.cli.scaffoldPlugins.map(plugin => {
                // console.log("Plugin =");
                // console.log(plugin);
                // const x = require("@webiny/cli-scaffold-graphql-service");

                return typeof plugin !== "string" ? plugin : require(plugin);
            });

            this.scaffoldPlugins = new PluginsContainer(loadedPlugins);
        }
    }

    loadUserPlugins() {
        if (this.config.cli) {
            const plugins = this.config.cli.plugins || [];
            this.plugins.register(
                ...plugins.map(plugin => {
                    if (typeof plugin === "string") {
                        return require(path.join(this.paths.projectRoot, plugin));
                    }
                    return plugin;
                })
            );
        }
    }

    log(...args) {
        debug(...args);
    }

    info(...args) {
        debug(...args);
    }

    debug(...args) {
        debug(...args);
    }

    error(...args) {
        debug(...args);
    }

    resolve(...dir) {
        return path.resolve(projectRoot, ...dir);
    }

    replaceProjectRoot(path) {
        return path.replace(projectRoot, "<projectRoot>").replace(/\\/g, "/");
    }

    async loadEnv(envPath, env, { debug = false }) {
        if (fs.existsSync(envPath)) {
            const envConfig = await GetEnvVars({
                rc: {
                    environments: ["default", env],
                    filePath: envPath
                }
            });

            Object.assign(process.env, envConfig);
            if (debug) {
                console.log(
                    `💡 Loaded ${green(env)} environment from ${green(
                        this.replaceProjectRoot(envPath)
                    )}...`
                );
            }
        }
    }
}

module.exports = new Context();