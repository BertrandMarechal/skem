import fs from 'fs';
import path from 'path';
import { FileManager } from './file-manager';
import colors from 'colors';
import { SkemOptions } from './command-line-args';
import { UserInterface } from './user-interface';
import { SkemConfigWrappers } from './skem-config-manager';

const localDBFile = path.resolve(__dirname, '../db/db.json');

export interface SkemVariables {
    variables: string[];
    variablesInFiles: {
        file: string;
        name: string;
    }[];
    fileVariables: Record<string, string[]>;
}

export interface SkemBlueprint extends SkemConfigWrappers {
    isFile: boolean;
    root: string;
    name: string;
    files: string[];
    variables: SkemVariables;
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

    async chooseConfiguration({ name }: Pick<SkemOptions, 'name'>): Promise<SkemBlueprint> {
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

    async printConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        const config = await this.chooseConfiguration({ name });
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

    addToConfig(configName: string, config: SkemBlueprint): void {
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

    exitIfConfigDoesNotExist(name: string): void {
        if (!this.config[name]) {
            console.error(`Unknown configuration: ${name}`);
            process.exit(1);
        }

    }

    private _updateConfigInFile() {
        FileManager.writeFileSync(localDBFile, JSON.stringify(this._config));
    }
}
