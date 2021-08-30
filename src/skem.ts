import { BlueprintManager } from './blueprint-manager';
import colors from 'colors';
import { SkemOptions } from './command-line-args';
import Path from 'path';
import { VariableManager } from './variable-manager';
import { FileManager } from './file-manager';
import child_process from 'child_process';
import { UserInterface } from './user-interface';
import { CONFIGURATION_FILE_NAME, SkemConfigManager, SkemConfigWrappers } from './skem-config-manager';

export class Skem {
    configManager: BlueprintManager;
    variableManager: VariableManager;

    constructor() {
        this.configManager = new BlueprintManager();
        this.variableManager = new VariableManager();
    }

    async install({ path, name, variables: optionsVariables }: SkemOptions): Promise<void> {
        const config = await this.configManager.chooseConfiguration({ name });
        const variables: Record<string, string> = this.variableManager.parseOptionsVariables(optionsVariables);
        console.log(`Installing ${colors.cyan(name)}`);
        if (config.variables.variables.length) {
            for (const variable of config.variables.variables) {
                variables[variable] = await UserInterface.chooseValidVariable(variable);
            }
        }
        const skemConfig = config;
        if (skemConfig.isFile) {
            const fileName = Path.basename(skemConfig.root);
            const newFileName = Path.resolve(path, VariableManager.replaceVariableInFileName(
                fileName,
                config.variables.variables,
                variables,
                SkemConfigManager.getFileNameVariableWrapper(this.configManager.config)
            ));
            console.log(newFileName);
            console.log(`Writing "${newFileName.replace(/\\\\/, '/')}"`);
            FileManager.writeFileSync(
                newFileName,
                VariableManager.replaceVariablesInFile(
                    skemConfig.root,
                    config.variables.variables,
                    variables,
                    SkemConfigManager.getVariableWrapper(skemConfig.root, this.configManager.config)
                )
            );
        } else {
            if (!variables.name) {
                variables.name = await UserInterface.chooseValidNameForBlueprintImplementation();
            }
            const newRoot = Path.resolve(path, variables.name);
            for (let i = 0; i < skemConfig.files.length; i++) {
                const fileName = skemConfig.files[i];
                const newFileName = newRoot + VariableManager.replaceVariableInFileName(
                    fileName,
                    skemConfig.variables.fileVariables[`${i}`] || [],
                    variables,
                    SkemConfigManager.getFileNameVariableWrapper(this.configManager.config)
                );
                console.log(`Writing "${newFileName.replace(/\\\\/, '/')}"`);
                FileManager.writeFileSync(
                    newFileName,
                    VariableManager.replaceVariablesInFile(
                        skemConfig.root + fileName,
                        skemConfig.variables.fileVariables[`${i}`] || [],
                        variables,
                        SkemConfigManager.getVariableWrapper(skemConfig.root + fileName, this.configManager.config)
                    )
                );
            }
            // if (options['install-packages']) {
            //     const packageJsons = skemConfig.files.filter(f => /package\.json$/.test(f));
            //     for (const packageJson of packageJsons) {
            //         const newFileName = newRoot + packageJson.replace(/package\.json$/, '');
            //         runPackageInstaller(newFileName);
            //     }
            // }
        }
    }

    async extractConfigFromProject(
        { path, name, isUpdate, folderNameFromLoop }: Pick<SkemOptions, 'path' | 'name'> & { isUpdate?: boolean, folderNameFromLoop?: string }
    ): Promise<void> {
        let configName: string = name || '';
        let skemConfig: SkemConfigManager | undefined;
        const isDirectory = FileManager.isDirectory(path);
        let skemWrappers: SkemConfigWrappers = {};

        if (isDirectory) {
            if (FileManager.exists(Path.resolve(path, CONFIGURATION_FILE_NAME))) {
                skemConfig = new SkemConfigManager(Path.resolve(path, CONFIGURATION_FILE_NAME));
                skemWrappers = skemConfig.skemWrappers;
                if(skemConfig.isSingleFiles) {
                    const singleBlueprints = skemConfig.singleFiles;
                    for (const singleBlueprint of singleBlueprints) {
                        await this.extractConfigFromProject({
                            path: Path.resolve(path, singleBlueprint.file),
                            name: singleBlueprint.name || '',
                            isUpdate,
                        });
                    }
                    return;
                }
                if (!configName && !!skemConfig.name) {
                    configName = skemConfig.name;
                }
            }
        }
        if (!configName && folderNameFromLoop) {
            configName = folderNameFromLoop;
        }
        if (!configName) {
            if (isDirectory) {
                configName = await UserInterface.overwriteFolderNameForBlueprint(configName);
            } else {
                configName = await UserInterface.chooseValidNameForBlueprint();
            }
        }
        if (!isUpdate) {
            const configs = this.configManager.config;
            if (configs[configName]) {
                await UserInterface.confirmOverwriteOfBlueprintOrExit(configName);
            }
        }
        if (isUpdate) {
            console.log(`    Updating ${colors.cyan(configName)}`);
        } else {
            console.log(`    Adding ${colors.cyan(configName)}`);
        }
        const root = Path.resolve(path);
        const files = FileManager.getFileList(root);
        const variables = VariableManager.getVariables(files, skemWrappers);
        if (configName) {
            this.configManager.addToConfig(configName,
                {
                    isFile: !isDirectory,
                    name: configName,
                    root,
                    files: isDirectory ? files.map(f => f.replace(root, '')) : [root],
                    variables: {
                        ...variables,
                        variablesInFiles: variables.variablesInFiles.map((item) => {
                            item.file = item.file.replace(root, '');
                            return item;
                        }),
                    },
                    ...skemWrappers,
                }
            );
            if (isUpdate) {
                console.log(`    Updated ${colors.cyan(configName)}`);
            } else {
                console.log(`    Added ${colors.cyan(configName)}`);
            }
            console.log();
        }
    }

    async loopOnSubFoldersAndExtractConfigFromProject(options: SkemOptions): Promise<void> {
        const { path } = options;
        console.log('Looping on folders to find configurations');
        const subFolders = FileManager.getNonIgnoredFolderList(path);
        for (const subFolder of subFolders) {
            console.log(`Processing ${subFolder}`);
            await this.extractConfigFromProject({
                ...options,
                path: Path.resolve(path, subFolder),
                folderNameFromLoop: subFolder
            });
        }
    }

    async update(options: SkemOptions): Promise<void> {
        const { name } = options;
        if (name) {
            this.configManager.exitIfConfigDoesNotExist(name);
            await this.extractConfigFromProject({
                ...options,
                path: this.configManager.config[name].root,
                isUpdate: true,
            });
        } else {
            const configNames = this.configManager.configNames;
            for (const schematic of configNames) {
                await this.extractConfigFromProject({
                    ...options,
                    path: this.configManager.config[schematic].root,
                    name: schematic,
                    isUpdate: true,
                });
            }
        }
    }

    listConfigs(): void {
        const configNames = this.configManager.configNames;
        if (configNames.length === 0) {
            console.log(colors.grey('There are no config available on this system. Try to add one with "skem add".'));
            return;
        }
        console.log(colors.grey(`Here ${configNames.length !== 1 ? 'are' : 'is'} the available config${configNames.length !== 1 ? 's' : ''}:`));
        console.log();
        for (const key of configNames) {
            console.log('-', key);
        }
    }

    async removeFromConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        await this.configManager.removeFromConfig({ name });
    }

    async printConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        await this.configManager.printConfig({ name });
    }

    private runPackageInstaller(cwd: string): void {
        child_process.execSync('npm install', {
            stdio: [0, 1, 2],
            cwd
        });
    }
}
