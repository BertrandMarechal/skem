import fs from "fs";
import path from "path";
import { FileManager } from "./file-manager";
import { chooseConfiguration, SkemOptions } from "./index";
import inquirer from "inquirer";
import colors from 'colors';

const localDBFile = path.resolve(__dirname, "./db/db.json");

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
    static getConfig(): Record<string, SkemConfig> {
        try {
            const data = fs.readFileSync(localDBFile, 'ascii');
            return JSON.parse(data);
        } catch (e) {
            FileManager.writeFileSync(localDBFile, JSON.stringify({}, null, 2));
            return {};
        }
    }

    static addToConfig(configName: string, config: SkemConfig) {
        const currentConfig = this.getConfig();
        currentConfig[configName] = config;
        FileManager.writeFileSync(localDBFile, JSON.stringify(currentConfig, null, 2));
    }

    static async removeFromConfig({ name }: SkemOptions) {
        const currentConfig = this.getConfig();
        if (name) {
            delete currentConfig[name];
            FileManager.writeFileSync(localDBFile, JSON.stringify(currentConfig, null, 2));
            console.log(`Configuration cleared for ${name}`);
        } else {
            const { all } = await inquirer.prompt({
                type: "confirm",
                name: 'all',
                message: 'Do you want to remove all configurations ?'
            });
            if (all) {
                FileManager.writeFileSync(localDBFile, JSON.stringify({}, null, 2));
                console.log(`Configuration cleared`);
            }
        }
    }

    static doesConfigExist(name: string): boolean {
        const currentConfig = this.getConfig();
        return !!currentConfig[name];
    }

    static async printConfig(options: SkemOptions) {
        const config = await chooseConfiguration(options);
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
}
