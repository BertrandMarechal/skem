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
    static exists(path: string): boolean {
        return fs.existsSync(path);
    }

    static getNonIgnoredFolderList(path: string): string[] {
        const files = fs.readdirSync(path);
        return files.filter(f =>
            FileManager.isDirectory(f) && !ignoredPaths.some(p => p === f)
        );
    }

    static getFileList(path: string, parentGitIgnores: { gitignore: unknown, root: string }[] = []): string[] {
        const gitIgnores = [...parentGitIgnores];
        if (!FileManager.isDirectory(path)) {
            return [path];
        }
        let files = fs.readdirSync(path);
        const hasGitignoreFile = files.some(f => f === '.gitignore');
        if (hasGitignoreFile) {
            gitIgnores.push({
                gitignore: gitignoreParser.compile(fs.readFileSync(Path.resolve(path, '.gitignore'), 'utf8')),
                root: Path.resolve(path)
            });
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
                const files = this.getFileList(file, gitIgnores);
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
        return files;
    }

    static writeFileSync(fileName: string, content: string): void {
        this.createFolderStructureIfNeeded(fileName);
        fs.writeFileSync(fileName, content);
    }

    static createFolderIfNotExistsSync(folderName: string): void {
        if (folderName && !fs.existsSync(folderName)) {
            fs.mkdirSync(folderName);
        }
    }

    static createFolderStructureIfNeeded(path: string, depth = 0): void {
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

