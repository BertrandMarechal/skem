import fs from 'fs';

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
}
