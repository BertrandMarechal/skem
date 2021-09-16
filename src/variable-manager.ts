import fs from 'fs';
import { SkemVariables } from './blueprint-manager';
import { SkemConfigManager, SkemConfigWrappers } from './skem-config-manager';
import { VariableTransformer, VariableTransformParamsWithDependencies } from './variable-transformer';
import { UserInterface } from './user-interface';

export class VariableManager {
    parseOptionsVariables(optionVariables: string[]): Record<string, string> {
        const variables: Record<string, string> = {};
        if (optionVariables) {
            for (const optionVariable of optionVariables) {
                if (!optionVariable) {
                    console.log('Please use variables as follow -v name="the name"');
                    process.exit(1);
                    return {};
                }
                const [key, value] = optionVariable.split('=');
                if (!key || !value) {
                    console.log('Please use variables as follow -v name="the name"');
                    process.exit(1);
                    return {};
                }
                variables[key] = value;
            }
        }
        return variables;
    }

    static async resolveVariables(
        configVariables: SkemVariables,
        variables: Record<string, string>,
        originalFiles: string[],
        selectedFiles: string[],
        variableTransform: Record<string, VariableTransformParamsWithDependencies>
    ): Promise<Record<string, string>> {
        const newVariables: Record<string, string | null> = {...variables};
        const variablesInSelectedFiles = originalFiles.reduce((agg: string[], file, i) => {
            if (selectedFiles.some(f => f === file)) {
                const fileVariables = configVariables.fileVariables[i] || [];
                for (const fileVariable of fileVariables) {
                    if (!agg.some(v => v === fileVariable)) {
                        agg.push(fileVariable);
                    }
                }
            }
            return agg;
        }, []);
        for (const variableInSelectedFiles of variablesInSelectedFiles) {
            newVariables[variableInSelectedFiles] = variables[variableInSelectedFiles] || null;
        }
        const variablesToGetInSelectedFiles = variablesInSelectedFiles.filter(v => !variables[v]);
        const unresolvedVariableDependencies = variablesToGetInSelectedFiles
            .map(v => {
                if (variableTransform[v]) {
                    return variableTransform[v].dependencies;
                }
                return [];
            })
            .reduce((agg: string[], curr: string[]) => {
                for (const item of curr) {
                    if (!variables[item] && !agg.some(v => v === item)) {
                        agg.push(item);
                    }
                }
                return agg;
            }, []);
        for (const unresolvedVariableDependency of unresolvedVariableDependencies) {
            newVariables[unresolvedVariableDependency] = null;
        }
        return VariableManager.resolveMissingVariables(newVariables, variableTransform);
    }

    static async resolveMissingVariables(
        variables: Record<string, string | null>,
        variableTransform: Record<string, VariableTransformParamsWithDependencies>
    ): Promise<Record<string, string>> {
        const newVariables = { ...variables };
        const variableNames = Object.keys(newVariables);

        const variablesWithoutDependencies = variableNames.filter(name =>
            !variableTransform[name] || variableTransform[name].dependencies.length === 0
        );
        for (const variableWithoutDependencies of variablesWithoutDependencies) {
            if (!newVariables[variableWithoutDependencies]) {
                let defaultValue = '';
                if (variableTransform[variableWithoutDependencies]?.default) {
                    defaultValue = variableTransform[variableWithoutDependencies].default as string;
                }
                newVariables[variableWithoutDependencies] = await UserInterface.chooseValidVariable(variableWithoutDependencies, defaultValue);
            }
        }

        while (variableNames.some(name => !newVariables[name])) {
            for (const name of variableNames) {
                if (!newVariables[name]) {
                    if (VariableTransformer.canBeSolved(name, variableTransform, newVariables)) {
                        newVariables[name] = VariableTransformer.transform(name, variableTransform, newVariables);
                    }
                }
            }
        }

        for (const key of variableNames) {
            if (variableTransform[key] && !variableTransform[key].skipIfDefined) {
                newVariables[key] = await UserInterface.chooseValidVariable(key, newVariables[key]);
            }
        }
        return newVariables as Record<string, string>;
    }

    static replaceVariableInFileName(
        path: string,
        fileVariables: string[],
        variables: Record<string, string>,
        wrapper: [string, string]
    ): string {
        let currentFileName = path;
        const [startWrapper, endWrapper] = this.translateWrappersToRegExpString(wrapper);
        for (const fileVariable of fileVariables) {
            const regExp = new RegExp(`${startWrapper}${fileVariable}${endWrapper}`, 'ig');
            currentFileName = currentFileName.replace(regExp, variables[fileVariable]);
        }
        return currentFileName;
    }

    static replaceVariablesInFile(
        path: string,
        fileVariables: string[],
        variables: Record<string, string>,
        wrapper: [string, string]
    ): string {
        let currentFile = fs.readFileSync(path, 'ascii');
        const [startWrapper, endWrapper] = this.translateWrappersToRegExpString(wrapper);
        for (const fileVariable of fileVariables) {
            const regExp = new RegExp(`${startWrapper}${fileVariable}${endWrapper}`, 'ig');
            currentFile = currentFile.replace(regExp, variables[fileVariable]);
        }
        return currentFile;
    }

    static getVariables(fileList: string[], skemWrappers: SkemConfigWrappers): SkemVariables {
        const variables: string[] = [];
        const fileVariables: Record<number, string[]> = {};
        const [fileNameStartWrapper, fileNameEndWrapper] = this.translateWrappersToRegExpString(SkemConfigManager.getFileNameVariableWrapper(skemWrappers));
        for (let i = 0; i < fileList.length; i++) {
            const fileName = fileList[i];
            const [fileContentStartWrapper, fileContentEndWrapper] = this.translateWrappersToRegExpString(SkemConfigManager.getVariableWrapper(fileName, skemWrappers));
            const data = fs.readFileSync(fileName, 'ascii');
            let matchedVariables = (data.match(new RegExp(`${fileContentStartWrapper}([a-z0-9-]+)${fileContentEndWrapper}`, 'ig')) || [])
                .concat(fileName.match(new RegExp(`${fileNameStartWrapper}([a-z0-9-]+)${fileNameEndWrapper}`, 'ig')) || []);
            if (matchedVariables.length) {
                matchedVariables = matchedVariables
                    .map(v => v.replace(new RegExp(`^(${fileContentStartWrapper}|${fileNameStartWrapper})([a-z0-9-]+)(${fileContentEndWrapper}|${fileNameEndWrapper})$`, 'i'), '$2'))
                    .reduce((agg: string[], curr) => {
                        if (!agg.some(item => item === curr)) {
                            agg.push(curr);
                        }
                        return agg;
                    }, []);
                const currentFileUniqueVariables: string[] = [];
                for (const variable of matchedVariables) {
                    VariableManager.validateName(variable, true);
                    if (!currentFileUniqueVariables.some(v => v === variable)) {
                        currentFileUniqueVariables.push(variable);
                    }
                    if (!variables.some(v => v === variable)) {
                        variables.push(variable);
                    }
                }
                fileVariables[i] = currentFileUniqueVariables;
            }
        }
        return {
            variables,
            fileVariables
        };
    }

    static validateName(variableName: string, exit = true): boolean {
        if (variableName.length < 2) {
            console.log(`Name "${variableName}" should be at least 2 characters long.`);
            if (exit) {
                process.exit(1);
            }
            return false;
        }
        if (!/^[a-z0-9_-]+$/i.test(variableName)) {
            console.log(`Invalid character in name "${variableName}". Please use only alphanumerical characters, and "-" or "_".`);
            if (exit) {
                process.exit(1);
            }
            return false;
        }
        if (!/^[a-z]/i.test(variableName)) {
            console.log(`Name "${variableName}" should start with a letter.`);
            if (exit) {
                process.exit(1);
            }
            return false;
        }
        if (/[_-]$/i.test(variableName)) {
            console.log(`Name "${variableName}" not end with "-" or "_".`);
            if (exit) {
                process.exit(1);
            }
            return false;
        }
        return true;
    }

    private static translateWrappersToRegExpString([start, end]: [string, string]): [string, string] {
        return [
            start.split('').map(s => /[a-z0-9]/i.test(s) ? s : `\\${s}`).join(''),
            end.split('').map(s => /[a-z0-9]/i.test(s) ? s : `\\${s}`).join(''),
        ];
    }
}
