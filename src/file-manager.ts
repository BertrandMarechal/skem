import fs from "fs";
import Path from "path";
import { SkemVariables } from "./config-manager";

const gitignoreParser = require("@gerhobbelt/gitignore-parser");

const ignoredPaths = [
    'node_modules',
    '.git'
];
const ignoredFiles = [
    'skem.json',
    'package-lock.json',
    'yarn.lock'
];

export class FileManager {
    static isDirectory(path: string) {
        return fs.lstatSync(path).isDirectory();
    }

    static getNonIgnoredFolderList(path: string) {
        let files = fs.readdirSync(path);
        return files.filter(f =>
            this.isDirectory(f) && !ignoredPaths.some(p => p === f)
        );
    }

    static getFileList(path: string, parentGitIgnores: { gitignore: any, root: string }[] = []): { files: string[]; preferredPackageManager: 'npm' | 'yarn'; } {
        const gitIgnores = [...parentGitIgnores];
        let currentPreferredPackageManager: 'npm' | 'yarn' | '' = "";
        if (!this.isDirectory(path)) {
            return {
                files: [path],
                preferredPackageManager: 'npm'
            };
        }
        let files = fs.readdirSync(path);
        const hasGitignoreFile = files.some(f => f === '.gitignore');
        if (hasGitignoreFile) {
            gitIgnores.push({
                gitignore: gitignoreParser.compile(fs.readFileSync(Path.resolve(path, '.gitignore'), 'utf8')),
                root: Path.resolve(path)
            });
        }
        for (const file of files) {
            if (file === 'package-lock.json') {
                currentPreferredPackageManager = 'npm';
            } else if (file === 'yarn.lock') {
                currentPreferredPackageManager = 'yarn';
            }
        }
        files = files
            .filter(fileName => {
                const realFileName = Path.resolve(path, fileName);
                for (const { root, gitignore } of gitIgnores) {
                    const denied = gitignore.denies(
                        realFileName
                            .replace(root + '\\', '')
                            .replace(/\\/g, '/')
                    );
                    if (denied) {
                        return false;
                    }
                }
                if (this.isDirectory(realFileName)) {
                    return !ignoredPaths.some(p => p === fileName);
                }
                return !ignoredFiles.some(p => p === fileName);
            })
            .map((fileName) => Path.resolve(path, fileName));

        let extraFiles: string[] = [];
        let directories: string[] = [];
        for (const file of files) {
            if (this.isDirectory(file)) {
                directories.push(file);
                const { files, preferredPackageManager } = this.getFileList(file, gitIgnores);
                if (!currentPreferredPackageManager) {
                    currentPreferredPackageManager = preferredPackageManager;
                }
                extraFiles.push(...files);
            }
        }
        files = files.filter(f => !directories.some(d => f === d));
        files = files.concat(extraFiles);
        files.sort((a, b) => {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
        return { files, preferredPackageManager: currentPreferredPackageManager || 'npm' };
    }

    static getVariables(fileList: string[]): SkemVariables {
        const variablesInFiles: { file: string, name: string }[] = [];
        const variables: string[] = [];
        const fileVariables: Record<number, string[]> = {};
        for (let i = 0; i < fileList.length; i++) {
            let fileName = fileList[i];
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

    static writeFileSync(fileName: string, content: string) {
        this.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }

    private static createFolderIfNotExistsSync(folderName: string) {
        if (folderName && !fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }

    private static createFolderStructureIfNeeded(path: string, depth: number = 0): void {
        const splitPath = path
            .replace(/\\/g, '/')
            .replace(/\/\//g, '/')
            .split('/');
        if (depth === splitPath.length - 1) {
            return;
        } else {
            this.createFolderIfNotExistsSync(splitPath.splice(0, depth + 1).join('/'));
            this.createFolderStructureIfNeeded(path, depth + 1);
        }
    }

}

