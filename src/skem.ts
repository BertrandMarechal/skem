import { BlueprintManager } from './blueprint-manager';
import colors from 'colors';
import { SkemOptions } from './command-line-args';
import Path from 'path';
import { VariableManager } from './variable-manager';
import { FileManager } from './file-manager';
import { UserInterface } from './user-interface';
import { CONFIGURATION_FILE_NAME, SkemConfigManager, SkemConfigWrappers, SkemHook } from './skem-config-manager';
import { BlueprintInstaller } from './blueprint-installer';
import { VariableTransformParamsWithDependencies } from './variable-transformer';
import { v4 } from 'uuid';
import child_process from 'child_process';

export class Skem {
    blueprintManager: BlueprintManager;
    blueprintInstaller: BlueprintInstaller;
    variableManager: VariableManager;

    constructor() {
        this.blueprintManager = new BlueprintManager();
        this.variableManager = new VariableManager();
        this.blueprintInstaller = new BlueprintInstaller();
    }

    async install(params: SkemOptions): Promise<void> {
        await this.blueprintInstaller.install(params);
    }

    async extractConfigFromProject(
        {
            path,
            name,
            isUpdate,
            git,
            folderNameFromLoop
        }: Pick<SkemOptions, 'path' | 'name' | 'git'> & {
            isUpdate?: boolean,
            folderNameFromLoop?: string
        },
        skemConfigManager?: SkemConfigManager
    ): Promise<void> {
        let configName: string = name || '';
        let skemConfig: SkemConfigManager | undefined;
        const isDirectory = FileManager.isDirectory(path);
        let skemWrappers: SkemConfigWrappers = {};
        let skemHooks: SkemHook[] = [];
        let skemVariableTransform: Record<string, VariableTransformParamsWithDependencies> = {};
        let isGit = !!git;
        let gitUrl = git;
        const addOrUpdate = isUpdate ? 'Updat' : 'Add';
        const configs = this.blueprintManager.config;
        const existingConfig = configs[configName];

        if (existingConfig?.gitUrl) {
            isGit = true;
            gitUrl = existingConfig.gitUrl;
            Skem.gitPullFF(existingConfig.root);
        }

        if (isDirectory) {
            if (FileManager.exists(Path.resolve(path, CONFIGURATION_FILE_NAME))) {
                skemConfig = new SkemConfigManager(Path.resolve(path, CONFIGURATION_FILE_NAME));
                skemWrappers = skemConfig.skemWrappers;
                skemHooks = skemConfig.hooks;
                skemVariableTransform = skemConfig.variableTransform;
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
        if (!isUpdate && configs[configName]) {
            await UserInterface.confirmOverwriteOfBlueprintOrExit(configName);
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
                    files: isDirectory ? files.map(f => Path.relative(root, f)) : [root],
                    variables,
                    ...skemWrappers,
                    variableTransform: skemVariableTransform,
                    hooks: skemHooks,
                    ...(isGit ? { gitUrl } : null)
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

    async addFromGit(options: Pick<SkemOptions, 'git'>): Promise<void> {
        const folderName = v4();
        if (options.git) {
            FileManager.createFolderIfNotExistsSync('./git-repos');
            Skem.cloneRepo(options.git, folderName);
    
            await this.extractConfigFromProject({
                name: '',
                ...options,
                path: `./git-repos/${folderName}`,
            });
        }
    }
    
    private static cloneRepo(url: string, folderName: string) {
        child_process.execSync(
            `git clone ${url} ./git-repos/${folderName}`,
            { stdio: [0, 1, 2] }
        );
    }
    
    private static gitPullFF(path: string) {
        console.log('Pulling latest from git');
        child_process.execSync(
            'git pull --ff',
            {
                stdio: [0, 1, 2],
                cwd: path
            }
        );
    }
}
