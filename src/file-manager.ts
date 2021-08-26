import fs from 'fs';
import Path from 'path';

import gitignoreParser from '@gerhobbelt/gitignore-parser';

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
    static isDirectory(path: string): boolean {
        return fs.lstatSync(path).isDirectory();
    }

    static getNonIgnoredFolderList(path: string): string[] {
        const files = fs.readdirSync(path);
        return files.filter(f =>
            this.isDirectory(f) && !ignoredPaths.some(p => p === f)
        );
    }

    static getFileList(path: string, parentGitIgnores: { gitignore: unknown, root: string }[] = []): { files: string[]; preferredPackageManager: 'npm' | 'yarn'; } {
        const gitIgnores = [...parentGitIgnores];
        let currentPreferredPackageManager: 'npm' | 'yarn' | '' = '';
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
                    const denied = (gitignore as { denies: (name: string) => boolean }).denies(
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

        const extraFiles: string[] = [];
        const directories: string[] = [];
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

    static writeFileSync(fileName: string, content: string): void {
        this.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }

    private static createFolderIfNotExistsSync(folderName: string) {
        if (folderName && !fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }

    private static createFolderStructureIfNeeded(path: string, depth = 0): void {
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

