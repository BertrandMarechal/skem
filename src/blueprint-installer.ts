import { SkemOptions } from './command-line-args';
import colors from 'colors';
import { UserInterface } from './user-interface';
import { SkemConfigManager } from './skem-config-manager';
import Path from 'path';
import { VariableManager } from './variable-manager';
import { FileManager } from './file-manager';
import { BlueprintManager } from './blueprint-manager';

export class BlueprintInstaller {
    blueprintManager: BlueprintManager;
    variableManager: VariableManager;

    constructor() {
        this.blueprintManager = new BlueprintManager();
        this.variableManager = new VariableManager();
    }

    async install(
        { path, name, variable: optionsVariables, force, pick }: Pick<SkemOptions, 'path' | 'name' | 'variable' | 'force' | 'pick'>
    ): Promise<void> {
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
                    const originalIndex = skemConfig.files.findIndex(f => f === fileName);
                    const newFileName = Path.resolve(newRoot, VariableManager.replaceVariableInFileName(
                        fileName,
                        skemConfig.variables.fileVariables[`${originalIndex}`] || [],
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
                                Path.resolve(skemConfig.root, fileName),
                                skemConfig.variables.fileVariables[`${originalIndex}`] || [],
                                variables,
                                SkemConfigManager.getVariableWrapper(Path.resolve(skemConfig.root, fileName), skemConfig)
                            )
                        );
                    }
                }
            }
            SkemConfigManager.runHooks(skemConfig.hooks, 'post-install', path);
        }
    }
}
