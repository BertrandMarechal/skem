import fs from 'fs';
import path from 'path';
import {FileManager} from './file-manager';
import colors from 'colors';
import {SkemOptions} from './command-line-args';
import {UserInterface} from './user-interface';

const localDBFile = path.resolve(__dirname, '../db/db.json');

export interface SkemVariables {
    variables: string[];
    variablesInFiles: {
        file: string;
        name: string;
    }[];
    fileVariables: Record<string, string[]>;
}

export interface SkemConfig {
    isFile: boolean;
    root: string;
    name: string;
    preferredPackageManager: 'npm' | 'yarn';
    files: string[];
    variables: SkemVariables;
}

export class ConfigManager {
    private _config: Record<string, SkemConfig>;
    constructor() {
        this._config = {};
        try {
            const data = fs.readFileSync(localDBFile, 'ascii');
            this._config = JSON.parse(data);
        } catch (e) {
            FileManager.writeFileSync(localDBFile, JSON.stringify({}));
        }
    }

    get config(): Record<string, SkemConfig> {
        return this._config;
    }

    get configNames(): string[] {
        return Object.keys(this._config);
    }


    async chooseConfiguration({ name }: Pick<SkemOptions, 'name'>): Promise<SkemConfig> {
        if (this.configNames.length === 0) {
            console.error('Could not find any config. Try to add one with "skem add".');
            process.exit(1);
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
            }
        }
        let configName = '';
        if (Object.keys(configNames).length === 1) {
            configName = configNames[0];
            console.log(`Selected ${configName} as the only config available${name ? ' with the filter' : ''}.`);
            console.log();
        }
        configName = await UserInterface.selectBlueprint(configNames);
        return this.config[configName];
    }

    async printConfig({name}: Pick<SkemOptions, 'name'>): Promise<void> {
        const config = await this.chooseConfiguration({name});
        let summary = `    ${colors.grey('Name')}: ${colors.cyan(config.name)}`;
        summary += `\n    ${colors.grey('Root')}: ${config.root}`;
        if (!config.isFile) {
            summary += `\n\n    ${colors.grey('Files')}:`;
            for (const files of config.files) {
                summary += `\n        - ${files}`;
            }
        } else {
            summary += `\n\n    ${colors.grey('Single File')}`;
        }
        summary += `\n\n    ${colors.grey('Variables')}:`;
        for (const variable of config.variables.variables) {
            summary += `\n        - ${variable}`;
        }
        console.log(summary);

    }

    static getConfig(): Record<string, SkemConfig> {
        try {
            const data = fs.readFileSync(localDBFile, 'ascii');
            return JSON.parse(data);
        } catch (e) {
            FileManager.writeFileSync(localDBFile, JSON.stringify({}));
            return {};
        }
    }

    addToConfig(configName: string, config: SkemConfig): void {
        this._config[configName] = config;
        this._updateConfigInFile();
    }

    async removeFromConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        if (name) {
            delete this._config[name];
            this._updateConfigInFile();
            console.log(`Configuration cleared for ${name}`);
        } else {
            const all = await UserInterface.removeAllConfigurations();
            if (all) {
                this._config = {};
                this._updateConfigInFile();
                console.log('Configuration cleared');
            }
        }
    }

    private _updateConfigInFile() {
        FileManager.writeFileSync(localDBFile, JSON.stringify(this._config));
    }

    static exitIfConfigDoesNotExist(name: string): void {
        const currentConfig = this.getConfig();
        if (!currentConfig[name]) {
            console.error(`Unknown configuration: ${name}`);
            process.exit(1);
        }

    }
}
