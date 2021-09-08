import { SkemOptions } from './command-line-args';
import colors from 'colors';
import { UserInterface } from './user-interface';
import { SkemConfigManager } from './skem-config-manager';
import Path from 'path';
import { VariableManager } from './variable-manager';
import { FileManager } from './file-manager';
import { BlueprintManager } from './blueprint-manager';
import { VariableTransformParamsWithDependencies } from './variable-transformer';

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
        const skemConfig = await this.blueprintManager.chooseConfiguration({ name });
        if (skemConfig) {
            console.log(`Installing ${colors.cyan(name)}`);
            SkemConfigManager.runHooks(skemConfig.hooks, 'pre-install', path);

            let originalFiles: string[] = [];
            let selectedFiles: string[] = [];

            if (skemConfig.isFile) {
                originalFiles = [skemConfig.root];
                selectedFiles = [skemConfig.root];
            } else {
                originalFiles = skemConfig.files;
                selectedFiles = skemConfig.files;
                if (pick === null || pick) {
                    if (pick) {
                        selectedFiles = originalFiles.filter(f => f.indexOf(pick) > -1);
                    }
                    if (selectedFiles.length === 0) {
                        console.log('No files could be picked with this filter. Please try with another filter.');
                        process.exit(1);
                        return;
                    }
                    if (selectedFiles.length !== 1) {
                        selectedFiles = await UserInterface.selectFilesToInstall(originalFiles);
                    }
                }
            }

            const variablesTransform: Record<string, VariableTransformParamsWithDependencies> = skemConfig.variableTransform;
            const variables = await VariableManager.resolveVariables(
                skemConfig.variables,
                this.variableManager.parseOptionsVariables(optionsVariables),
                originalFiles,
                selectedFiles,
                variablesTransform,
            );

            if (skemConfig.isFile) {
                const fileName = Path.basename(skemConfig.root);
                const newFileName = Path.resolve(path, VariableManager.replaceVariableInFileName(
                    fileName,
                    skemConfig.variables.variables,
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
                            skemConfig.variables.variables,
                            variables,
                            SkemConfigManager.getVariableWrapper(skemConfig.root, skemConfig)
                        )
                    );
                }
            } else {
                const newRoot = Path.resolve(path);
                for (let i = 0; i < selectedFiles.length; i++) {
                    const fileName = selectedFiles[i];
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
