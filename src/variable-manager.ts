import fs from 'fs';
import { SkemVariables } from './blueprint-manager';
import { SkemConfigManager, SkemConfigWrappers } from './skem-config-manager';

export class VariableManager {
    parseOptionsVariables(optionVariables: string[]): Record<string, string> {
        const variables: Record<string, string> = {};
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
        return variables;
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
        const variablesInFiles: { file: string, name: string }[] = [];
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
                    if (!currentFileUniqueVariables.some(v => v === variable)) {
                        currentFileUniqueVariables.push(variable);
                    }
                    variablesInFiles.push({ file: fileName, name: variable });
                    if (!variables.some(v => v === variable)) {
                        variables.push(variable);
                    }
                }
                fileVariables[i] = currentFileUniqueVariables;
            }
        }
        return {
            variables,
            variablesInFiles,
            fileVariables
        };
    }

    private static translateWrappersToRegExpString([start, end]: [string, string]): [string, string] {
        return [
            start.split('').map(s => /[a-z0-9]/i.test(s) ? s : `\\${s}`).join(''),
            end.split('').map(s => /[a-z0-9]/i.test(s) ? s : `\\${s}`).join(''),
        ];
    }
}
