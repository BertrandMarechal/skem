import fs from 'fs';
import path from 'path';
import { FileManager } from './file-manager';
import colors from 'colors';
import { SkemOptions } from './command-line-args';
import { UserInterface } from './user-interface';
import { SkemConfigWrappers, SkemHooks } from './skem-config-manager';
import { SkemConfigVariableTransformWithDependencies } from './variable-transformer';

const localDBFile = path.resolve(__dirname, '../db/db.json');

export interface SkemVariables {
    variables: string[];
    fileVariables: Record<string, string[]>;
}

export interface SkemBlueprint extends SkemConfigWrappers, SkemHooks, SkemConfigVariableTransformWithDependencies {
    isFile: boolean;
    root: string;
    name: string;
    files: string[];
    variables: SkemVariables;
    gitUrl?: string;
}

export class BlueprintManager {
    private _config: Record<string, SkemBlueprint>;

    constructor() {
        this._config = {};
        try {
            const data = fs.readFileSync(localDBFile, 'ascii');
            this._config = JSON.parse(data);
        } catch (e) {
            FileManager.writeFileSync(localDBFile, JSON.stringify({}));
        }
    }

    get config(): Record<string, SkemBlueprint> {
        return this._config;
    }

    get configNames(): string[] {
        return Object.keys(this._config);
    }

    async chooseConfiguration({ name }: Pick<SkemOptions, 'name'>): Promise<SkemBlueprint | undefined> {
        if (this.configNames.length === 0) {
            console.error('Could not find any blueprints. Try to add one with "skem add".');
            process.exit(1);
            return;
        }
        let configNames = this.configNames;
        if (name) {
            if (this.config[name]) {
                return this.config[name];
            }
            configNames = configNames.filter(c => c.indexOf(name) > -1);
            if (configNames.length === 0) {
                console.error(`Unknown configuration: ${name}`);
                process.exit(1);
                return;
            }
        }
        let configName = '';
        if (Object.keys(configNames).length === 1) {
            configName = configNames[0];
            console.log(`Selected ${configName} as the only config available${name ? ' with the filter' : ''}.`);
            console.log();
        }
        if (!configName) {
            configName = await UserInterface.selectBlueprint(configNames);
        }
        return this.config[configName];
    }

    async printConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        const config = await this.chooseConfiguration({ name });
        if (config) {
            let summary = `    ${colors.grey('Name')}: ${colors.cyan(config.name)}`;
            summary += `\n    ${colors.grey('Root')}: ${config.root}`;
            if (!config.isFile) {
                if (config.files.length) {
                    summary += `\n\n    ${colors.grey('Files')}:`;
                    for (const files of config.files) {
                        summary += `\n        - ${files}`;
                    }
                }
            } else {
                summary += `\n\n    ${colors.grey('Single File')}`;
            }
            if (config.fileNameVariableWrapper) {
                summary += `\n\n    ${colors.grey('File name variable wrapper')}: ${config.fileNameVariableWrapper}`;
            }
            if (config.variableWrapper) {
                summary += `\n\n    ${colors.grey('Variable wrapper')}: ${config.variableWrapper}`;
            }
            if (config.variableWrappers?.length) {
                summary += `\n\n    ${colors.grey('Variable wrappers')}:`;
                for (const { wrapper, extension } of config.variableWrappers) {
                    summary += `\n        - ${wrapper} for "${extension}"`;
                }
            }
            if (config.hooks?.length) {
                summary += `\n\n    ${colors.grey('Hooks')}:`;
                for (const { type, command, path } of config.hooks) {
                    summary += `\n        - "${command}" to run at "${type}" in "${path}"`;
                }
            }
            if (config.variables.variables.length) {
                summary += `\n\n    ${colors.grey('Variables')}:`;
                for (const variable of config.variables.variables) {
                    summary += `\n        - ${variable}`;
                }
            }
            console.log(summary);
        }
    }

    addToConfig(configName: string, config: SkemBlueprint): void {
        this._config[configName] = config;
        this._updateConfigInFile();
    }

    async removeFromConfig({ name, force }: Pick<SkemOptions, 'name' | 'force'>): Promise<void> {
        if (name) {
            delete this._config[name];
            this._updateConfigInFile();
            console.log(`Library cleared for ${name}`);
        } else {
            if (this.configNames.length === 0) {
                console.log('Library is already cleared');
                return;
            }
            let all = false;
            if (!force) {
                all = await UserInterface.removeAllConfigurations();
            }
            if (force || all) {
                this._config = {};
                this._updateConfigInFile();
                console.log('Library cleared');
            }
        }
    }

    exitIfConfigDoesNotExist(name: string): boolean {
        if (!this.config[name]) {
            console.error(`Unknown configuration: ${name}`);
            process.exit(1);
            return false;
        }
        return true;
    }

    private _updateConfigInFile() {
        FileManager.writeFileSync(localDBFile, JSON.stringify(this._config));
    }
}
