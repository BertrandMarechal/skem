import fs from 'fs';
import {SkemVariables} from './config-manager';

export class VariableManager {
    static replaceVariableInFileName(path: string, fileVariables: string[], variables: Record<string, string>): string {
        let currentFileName = path;
        for (const fileVariable of fileVariables) {
            const regExp = new RegExp(`___${fileVariable}___`, 'ig');
            currentFileName = currentFileName.replace(regExp, variables[fileVariable]);
        }
        return currentFileName;
    }
    static replaceVariablesInFile(path: string, fileVariables: string[], variables: Record<string, string>): string {
        let currentFile = fs.readFileSync(path, 'ascii');
        for (const fileVariable of fileVariables) {
            const regExp = new RegExp(`___${fileVariable}___`, 'ig');
            currentFile = currentFile.replace(regExp, variables[fileVariable]);
        }
        return currentFile;
    }

    static getVariables(fileList: string[]): SkemVariables {
        const variablesInFiles: { file: string, name: string }[] = [];
        const variables: string[] = [];
        const fileVariables: Record<number, string[]> = {};
        for (let i = 0; i < fileList.length; i++) {
            const fileName = fileList[i];
            const data = fs.readFileSync(fileName, 'ascii');
            let matchedVariables = (data.match(/___([a-z0-9-]+)___/ig) || [])
                .concat(fileName.match(/___([a-z0-9-]+)___/ig) || []);
            if (matchedVariables.length) {
                matchedVariables = matchedVariables
                    .map(v => v.replace(/^___([a-z0-9-]+)___$/i, '$1'))
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
}
