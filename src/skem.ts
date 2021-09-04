import { BlueprintManager } from './blueprint-manager';
import colors from 'colors';
import { SkemOptions } from './command-line-args';
import Path from 'path';
import { VariableManager } from './variable-manager';
import { FileManager } from './file-manager';
import { UserInterface } from './user-interface';
import { CONFIGURATION_FILE_NAME, SkemConfigManager, SkemConfigWrappers, SkemHook } from './skem-config-manager';

export class Skem {
    blueprintManager: BlueprintManager;
    variableManager: VariableManager;

    constructor() {
        this.blueprintManager = new BlueprintManager();
        this.variableManager = new VariableManager();
    }

    async install({ path, name, variable: optionsVariables, force, pick }: SkemOptions): Promise<void> {
        const config = await this.blueprintManager.chooseConfiguration({ name });
        if (config) {
            const variables: Record<string, string> = this.variableManager.parseOptionsVariables(optionsVariables);
            console.log(`Installing ${colors.cyan(name)}`);
            if (config.variables.variables.length) {
                for (const variable of config.variables.variables) {
                    if (!variables[variable]) {
                        variables[variable] = await UserInterface.chooseValidVariable(variable);
                    }
                }
            }
            const skemConfig = config;
            SkemConfigManager.runHooks(skemConfig.hooks, 'pre-install', path);

            if (skemConfig.isFile) {
                const fileName = Path.basename(skemConfig.root);
                const newFileName = Path.resolve(path, VariableManager.replaceVariableInFileName(
                    fileName,
                    config.variables.variables,
                    variables,
                    SkemConfigManager.getFileNameVariableWrapper(skemConfig)
                ));
                let writeFile = true;
                if (FileManager.exists(newFileName)) {
                    writeFile = force || await UserInterface.confirmOverwriteOfFile(newFileName);
                }

                if (writeFile) {
                    console.log(`Writing "${newFileName.replace(/\\\\/, '/')}"`);
                    FileManager.writeFileSync(
                        newFileName,
                        VariableManager.replaceVariablesInFile(
                            skemConfig.root,
                            config.variables.variables,
                            variables,
                            SkemConfigManager.getVariableWrapper(skemConfig.root, skemConfig)
                        )
                    );
                }
            } else {
                const newRoot = Path.resolve(path);
                let files = skemConfig.files;
                console.log(pick);
                if (pick === null || pick) {
                    if (pick) {
                        files = files.filter(f => f.indexOf(pick) > -1);
                    }
                    if (files.length === 0) {
                        console.log('No files could be picked with this filter. Please try with another filter.');
                        process.exit(1);
                        return;
                    }
                    if (files.length !== 1) {
                        files = await UserInterface.selectFilesToInstall(files);
                    }
                }
                for (let i = 0; i < files.length; i++) {
                    const fileName = files[i];
                    const newFileName = newRoot + VariableManager.replaceVariableInFileName(
                        fileName,
                        skemConfig.variables.fileVariables[`${i}`] || [],
                        variables,
                        SkemConfigManager.getFileNameVariableWrapper(skemConfig)
                    );
                    let writeFile = true;
                    if (FileManager.exists(newFileName)) {
                        writeFile = force || await UserInterface.confirmOverwriteOfFile(newFileName);
                    }
                    if (writeFile) {
                        console.log(`Writing "${newFileName.replace(/\\\\/, '/')}"`);
                        FileManager.writeFileSync(
                            newFileName,
                            VariableManager.replaceVariablesInFile(
                                skemConfig.root + fileName,
                                skemConfig.variables.fileVariables[`${i}`] || [],
                                variables,
                                SkemConfigManager.getVariableWrapper(skemConfig.root + fileName, skemConfig)
                            )
                        );
                    }
                }
            }
            SkemConfigManager.runHooks(skemConfig.hooks, 'post-install', path);
        }
    }

    async extractConfigFromProject(
        {
            path,
            name,
            isUpdate,
            folderNameFromLoop
        }: Pick<SkemOptions, 'path' | 'name'> & { isUpdate?: boolean, folderNameFromLoop?: string },
        skemConfigManager?: SkemConfigManager
    ): Promise<void> {
        let configName: string = name || '';
        let skemConfig: SkemConfigManager | undefined;
        const isDirectory = FileManager.isDirectory(path);
        let skemWrappers: SkemConfigWrappers = {};
        let skemHooks: SkemHook[] = [];
        const addOrUpdate = isUpdate ? 'Updat' : 'Add';

        if (isDirectory) {
            if (FileManager.exists(Path.resolve(path, CONFIGURATION_FILE_NAME))) {
                skemConfig = new SkemConfigManager(Path.resolve(path, CONFIGURATION_FILE_NAME));
                skemWrappers = skemConfig.skemWrappers;
                skemHooks = skemConfig.hooks;
                if (skemConfig.isSingleFiles) {
                    const singleBlueprints = skemConfig.singleFiles;
                    for (const singleBlueprint of singleBlueprints) {
                        await this.extractConfigFromProject({
                            path: Path.resolve(path, singleBlueprint.file),
                            name: singleBlueprint.name || '',
                            isUpdate,
                        });
                    }
                    return;
                } else if (skemConfig.isSingleFile) {
                    const singleBlueprints = skemConfig.singleFiles;
                    for (const singleBlueprint of singleBlueprints) {
                        await this.extractConfigFromProject({
                            path: Path.resolve(path, singleBlueprint.file),
                            name: singleBlueprint.name || configName,
                            isUpdate,
                        }, skemConfig);
                    }
                    return;
                }
                if (!configName && !!skemConfig.name) {
                    configName = skemConfig.name;
                }
            }
        } else {
            if (skemConfigManager) {
                skemWrappers = skemConfigManager.skemWrappers;
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
            const configs = this.blueprintManager.config;
            if (configs[configName]) {
                await UserInterface.confirmOverwriteOfBlueprintOrExit(configName);
            }
        }
        console.log(`    ${addOrUpdate}ing ${colors.cyan(configName)}`);
        const root = Path.resolve(path);
        const files = FileManager.getFileList(root);
        const variables = VariableManager.getVariables(files, skemWrappers);
        if (configName) {
            this.blueprintManager.addToConfig(configName,
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
                    hooks: skemHooks
                }
            );
            console.log(`    ${addOrUpdate}ed ${colors.cyan(configName)}`);
            console.log();
        }
    }

    async loopOnSubFoldersAndExtractConfigFromProject(options: SkemOptions): Promise<void> {
        const { path } = options;
        console.log('Looping on folders to find blueprints');
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
            if (this.blueprintManager.exitIfConfigDoesNotExist(name)) {
                await this.extractConfigFromProject({
                    ...options,
                    path: this.blueprintManager.config[name].root,
                    isUpdate: true,
                });
                return;
            }
        } else {
            const configNames = this.blueprintManager.configNames;
            if (!configNames.length) {
                console.error('Could not find any blueprints. Try to add one with "skem add".');
            }
            for (const schematic of configNames) {
                await this.extractConfigFromProject({
                    ...options,
                    path: this.blueprintManager.config[schematic].root,
                    name: schematic,
                    isUpdate: true,
                });
            }
        }
    }

    listConfigs(): void {
        const configNames = this.blueprintManager.configNames;
        if (configNames.length === 0) {
            console.log(colors.grey('There are no blueprints available on this system. Try to add one with "skem add".'));
            return;
        }
        console.log(colors.grey(`Here ${configNames.length !== 1 ? 'are' : 'is'} the available blueprint${configNames.length !== 1 ? 's' : ''}:`));
        console.log();
        for (const key of configNames) {
            console.log('-', key);
        }
    }

    async removeFromConfig({ name, force }: Pick<SkemOptions, 'name' | 'force'>): Promise<void> {
        await this.blueprintManager.removeFromConfig({ name, force });
    }

    async printConfig({ name }: Pick<SkemOptions, 'name'>): Promise<void> {
        await this.blueprintManager.printConfig({ name });
    }
}
