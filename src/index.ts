#!/usr/bin/env node
import commandLineArgs from "command-line-args";
import { FileManager } from "./file-manager";
import { ConfigManager, SkemConfig } from "./config-manager";
import Path from "path";
import { VariableManager } from "./variable-manager";
import child_process from 'child_process';
import inquirer from 'inquirer';

export interface SkemOptions {
    command:
        | 'help' | 'h'
        | 'install' | 'i'
        | 'add' | 'a'
        | 'generate' | 'g'
        | 'list' | 'ls'
        | 'remove' | 'rm'
        | 'update' | 'u'
        | 'print' | 'p';
    'install-packages': boolean;
    help: boolean;
    repo: boolean;
    all: boolean;
    name: string;
    ignore: string;
    path: string;
}

const options: SkemOptions = commandLineArgs([
    {
        name: 'command',
        type: String,
        multiple: false,
        defaultOption: true,
        defaultValue: 'help'
    },
    {
        name: 'install-packages',
        type: Boolean,
        defaultValue: false
    },
    {
        name: 'ignore',
        alias: 'i',
        type: String,
        defaultValue: ""
    },
    {
        name: 'repo',
        alias: 'r',
        type: Boolean,
        defaultValue: false
    },
    {
        name: 'help',
        alias: 'h',
        type: Boolean,
        defaultValue: false
    },
    {
        name: 'all',
        alias: 'a',
        type: Boolean,
        defaultValue: false
    },
    {
        name: 'name',
        alias: 'n',
        type: String
    },
    {
        name: 'path',
        alias: 'p',
        type: String,
        defaultValue: '.'
    },
]) as any;

export async function chooseConfiguration({ name }: SkemOptions): Promise<SkemConfig> {
    const configs = ConfigManager.getConfig();
    if (name) {
        if (!configs[name]) {
            console.error(`Unknown configuration: ${name}`);
            process.exit(1);
        }
        return configs[name];
    }
    let configName: string = "";
    if (Object.keys(configs).length === 0) {
        console.error('Could not find any config. Try to add one with "skem add".');
        process.exit(1);
    }
    if (Object.keys(configs).length === 1) {
        configName = Object.keys(configs)[0];
        console.log(`Selected ${configName} as the only config available.`);
        console.log();
    }
    while (!configName) {
        const { choice } = await inquirer.prompt({
            name: 'choice',
            type: "list",
            message: 'Please choose the configuration you want:',
            choices: Object.keys(configs)
        });
        configName = choice;
    }
    return configs[configName];
}

export function runPackageInstaller(cwd: string) {
    child_process.execSync('npm install', {
        stdio: [0, 1, 2],
        cwd
    });
}

export async function update(options: SkemOptions) {
    const config = ConfigManager.getConfig();
    const { name } = options;
    if (name) {
        if (!config[name]) {
            console.error(`Unknown configuration: ${name}`);
            process.exit(1);
        }
        console.log(`Updating ${name}`);
        await extractConfigFromProject({ ...options, path: config[name].root });
    } else {
        const schematics = Object.keys(config);
        for (const schematic of schematics) {
            console.log(`Updating ${schematic}`);
            await extractConfigFromProject({ ...options, path: config[schematic].root, name: schematic });
        }
    }
}

export async function loopOnSubFoldersAndExtractConfigFromProject(options: SkemOptions) {
    const { path } = options;
    console.log('Looping on folders to find configurations');
    const subFolders = FileManager.getNonIgnoredFolderList(path);
    for (const subFolder of subFolders) {
        console.log(`Processing ${subFolder}`);
        await extractConfigFromProject({
            ...options,
            path: Path.resolve(path, subFolder),
            name: subFolder
        });
    }
}

export async function extractConfigFromProject({ path, name }: SkemOptions) {
    console.log(`Adding ${name}`);
    const root = Path.resolve(path);
    const { files, preferredPackageManager } = FileManager.getFileList(root);
    const variables = FileManager.getVariables(files);
    if (name) {
        ConfigManager.addToConfig(name, {
                name,
                root,
                preferredPackageManager,
                files: files.map(f => f.replace(root, '')),
                variables: {
                    ...variables,
                    variablesInFiles: variables.variablesInFiles.map(item => {
                        item.file = item.file.replace(root, '');
                        return item;
                    }),
                },
            }
        );
        console.log(`Added ${name}`);
    }
}

export async function install(
    options: SkemOptions,
) {
    const { path, name } = options
    const config = await chooseConfiguration(options);
    let variables: Record<string, string> = {};
    console.log(`Installing ${name}`);
    if (config.variables.variables.length) {
        for (let variable of config.variables.variables) {
            while (!variables[variable]) {
                const { response } = await inquirer.prompt({
                    type: "input",
                    message: `Please provide a value for variable "${variable}":`,
                    name: 'response'
                });
                variables[variable] = response;
            }
        }
    }
    const skemConfig = config;
    const newRoot = Path.resolve(path, variables.name);
    for (let i = 0; i < skemConfig.files.length; i++) {
        const fileName = skemConfig.files[i];
        const newFileName = newRoot + VariableManager.replaceVariableInFileName(
            fileName,
            skemConfig.variables.fileVariables[`${i}`] || [],
            variables
        );
        console.log(`Writing "${newFileName.replace(/\\\\/, '/')}"`);
        FileManager.writeFileSync(
            newFileName,
            VariableManager.replaceVariablesInFile(
                skemConfig.root + fileName,
                skemConfig.variables.fileVariables[`${i}`] || [],
                variables
            )
        );
    }
    if (options["install-packages"]) {
        const packageJsons = skemConfig.files.filter(f => /package\.json$/.test(f));
        for (let packageJson of packageJsons) {
            const newFileName = newRoot + packageJson.replace(/package\.json$/, '');
            runPackageInstaller(newFileName);
        }
    }
}

async function listConfigs() {
    const config = ConfigManager.getConfig();
    const configs = Object.keys(config);
    if (configs.length === 0) {
        console.log('There are no config available on this system. Try to add one with "skem add".');
        return;
    }
    console.log(`Here ${configs.length !== 1 ? 'are' : 'is'} the available config${configs.length !== 1 ? 's' : ''}:`);
    console.log();
    for (let key of configs) {
        console.log('-', key);
    }
}

async function printConfig(options: SkemOptions) {
    const config = await chooseConfiguration(options);
    let summary = `    Name: ${config.name}`;
    summary += `\n    Root: ${config.root}`;
    summary += `\n\n    Files:`;
    for (const files of config.files) {
        summary += `\n        - ${files}`;
    }
    summary += `\n\n    Variables:`;
    for (const variable of config.variables.variables) {
        summary += `\n        - ${variable}`;
    }
    console.log(summary);
}

async function main() {
    console.log();
    switch (options.command) {
        case 'help':
        case 'h':
            break;
        case 'install':
        case 'i':
        case 'generate':
        case 'g':
            await install(options);
            break;
        case 'add':
        case 'a':
            if (options.repo) {
                await loopOnSubFoldersAndExtractConfigFromProject(options);
            } else if (!options.name) {
                console.error('Missing argument: --name');
                process.exit(1);
            } else if (options.name) {
                await extractConfigFromProject(options);
            }
            break;
        case 'remove':
        case 'rm':
            await ConfigManager.removeFromConfig(options);
            break;
        case 'list':
        case 'ls':
            await listConfigs();
            break;
        case 'print':
        case 'p':
            await printConfig(options);
            break;
        case 'update':
        case 'u':
            await update(options);
            break;
    }
}

(async () => {
    await main();
})();

