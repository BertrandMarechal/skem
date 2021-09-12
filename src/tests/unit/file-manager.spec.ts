import { jest } from '@jest/globals';

const mockFS = {
    lstatSync: jest.fn((_path: string) => ({ isDirectory: (): boolean => false })),
    existsSync: jest.fn(),
    readdirSync: jest.fn((_path: string): string[] => []),
    writeFileSync: jest.fn(),
    mkdirSync: jest.fn(),
    readFileSync: jest.fn(),
    rmdirSync: jest.fn(),
};
const gitignoreDenier = {
    denies: jest.fn((_path: string) => false),
};
const mockGitIgnoreParser = {
    compile: jest.fn(() => gitignoreDenier),
};
jest.mock('fs', () => mockFS);
jest.mock('@gerhobbelt/gitignore-parser', () => mockGitIgnoreParser);

import { FileManager } from '../../file-manager';
import Path from 'path';

describe('file-manager', function () {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('isDirectory', function () {
        it('should return true if lstat tells it is', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementationOnce(() => ({ isDirectory: () => true }));
            expect(FileManager.isDirectory('path')).toEqual(true);
            expect(lstatSyncSpy).toHaveBeenCalledWith('path');
        });
        it('should return false if lstat tells it is not', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementationOnce(() => ({ isDirectory: () => false }));
            expect(FileManager.isDirectory('path')).toEqual(false);
            expect(lstatSyncSpy).toHaveBeenCalledWith('path');
        });
    });
    describe('exists', function () {
        it('should return true if exists tells it is', () => {
            const existsSyncSpy = jest.spyOn(mockFS, 'existsSync')
                .mockImplementationOnce(() => true);
            expect(FileManager.exists('path')).toEqual(true);
            expect(existsSyncSpy).toHaveBeenCalledWith('path');
        });
        it('should return false if exists tells it is not', () => {
            const existsSyncSpy = jest.spyOn(mockFS, 'existsSync')
                .mockImplementationOnce(() => false);
            expect(FileManager.exists('path')).toEqual(false);
            expect(existsSyncSpy).toHaveBeenCalledWith('path');
        });
    });
    describe('getNonIgnoredFolderList', function () {
        it('should return a list of directories that are not ignored', () => {
            const readdirSyncSpy = jest.spyOn(mockFS, 'readdirSync')
                .mockImplementationOnce(() => [
                    'node_modules', '.git', 'src'
                ]);
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementation(() => ({ isDirectory: () => true }));

            expect(FileManager.getNonIgnoredFolderList('path')).toEqual(['src']);
            expect(readdirSyncSpy).toHaveBeenCalledWith('path');
            lstatSyncSpy.mockReset();
        });
    });
    describe('getFileList', function () {
        it('should return the path if it is a file', () => {
            jest.spyOn(mockFS, 'lstatSync')
                .mockImplementationOnce(() => ({ isDirectory: () => false }));
            expect(FileManager.getFileList('path')).toEqual(['path']);
        });
        it('should return the files it finds', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementation((path: string) => ({ isDirectory: () => path === 'path' }));
            const readdirSyncSpy = jest.spyOn(mockFS, 'readdirSync')
                .mockImplementationOnce(() => ['file1', 'file3', 'file2', 'file2']);

            expect(FileManager.getFileList('path')).toEqual([
                Path.resolve('path', 'file1'),
                Path.resolve('path', 'file2'),
                Path.resolve('path', 'file2'),
                Path.resolve('path', 'file3'),
            ]);

            expect(readdirSyncSpy).toHaveBeenCalledWith('path');

            lstatSyncSpy.mockReset();
        });
        it('should return the files it finds and do a recursive call', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementation((path: string) => ({
                    isDirectory: () => path === 'path' || path === Path.resolve('path', 'src')
                }));
            const readdirSyncSpy = jest.spyOn(mockFS, 'readdirSync')
                .mockImplementation((path: string) =>
                    path === 'path' ?
                        ['file1', 'file3', 'src', 'file2'] :
                        ['file4', 'file5']
                );

            expect(FileManager.getFileList('path')).toEqual([
                Path.resolve('path', 'file1'),
                Path.resolve('path', 'file2'),
                Path.resolve('path', 'file3'),
                Path.resolve('path', 'src/file4'),
                Path.resolve('path', 'src/file5'),
            ]);

            expect(readdirSyncSpy).toHaveBeenCalledWith('path');

            lstatSyncSpy.mockReset();
            readdirSyncSpy.mockReset();
        });
        it('should ignore the folders to ignore', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementation((path: string) => ({
                    isDirectory: () => path === 'path' || path === Path.resolve('path', 'node_modules')
                }));
            const readdirSyncSpy = jest.spyOn(mockFS, 'readdirSync')
                .mockImplementationOnce(() => ['file1', 'file3', 'node_modules', 'file2']);

            expect(FileManager.getFileList('path')).toEqual([
                Path.resolve('path', 'file1'),
                Path.resolve('path', 'file2'),
                Path.resolve('path', 'file3'),
            ]);

            expect(readdirSyncSpy).toHaveBeenCalledWith('path');

            lstatSyncSpy.mockReset();
        });
        it('should ignore the things are told to ignore by gitignore', () => {
            const lstatSyncSpy = jest.spyOn(mockFS, 'lstatSync')
                .mockImplementation((path: string) => ({
                    isDirectory: () => path === 'path'
                }));
            const readdirSyncSpy = jest.spyOn(mockFS, 'readdirSync')
                .mockImplementationOnce(() => ['file1', 'file3', 'file2', '.gitignore']);
            const deniesSpy = jest.spyOn(gitignoreDenier, 'denies')
                .mockImplementation((path: string) => {
                    console.log(path);
                    return path === 'file2';
                });

            expect(FileManager.getFileList('path')).toEqual([
                Path.resolve('path', '.gitignore'),
                Path.resolve('path', 'file1'),
                Path.resolve('path', 'file3'),
            ]);

            expect(readdirSyncSpy).toHaveBeenCalledWith('path');
            expect(deniesSpy).toHaveBeenCalledTimes(4);

            lstatSyncSpy.mockReset();
        });
    });
    describe('writeFileSync', function () {
        it('should call createFolderStructureIfNeededSpy and write the file', () => {
            const createFolderStructureIfNeededSpy = jest.spyOn(FileManager, 'createFolderStructureIfNeeded');
            const writeFileSyncSpy = jest.spyOn(mockFS, 'writeFileSync');

            FileManager.writeFileSync('path', 'content');

            expect(createFolderStructureIfNeededSpy).toHaveBeenCalledWith('path');
            expect(writeFileSyncSpy).toHaveBeenCalledWith('path', 'content');
        });
    });
    describe('createFolderIfNotExistsSync', function () {
        it('should create the folder if it does not exist', () => {
            const existsSyncSpy = jest.spyOn(mockFS, 'existsSync')
                .mockImplementationOnce(() => false);
            const mkdirSyncSpy = jest.spyOn(mockFS, 'mkdirSync');

            FileManager.createFolderIfNotExistsSync('path');

            expect(existsSyncSpy).toHaveBeenCalledWith('path');
            expect(mkdirSyncSpy).toHaveBeenCalledWith('path');
        });
        it('should not create the folder if does exist', () => {
            const existsSyncSpy = jest.spyOn(mockFS, 'existsSync')
                .mockImplementationOnce(() => true);
            const mkdirSyncSpy = jest.spyOn(mockFS, 'mkdirSync');

            FileManager.createFolderIfNotExistsSync('path');

            expect(existsSyncSpy).toHaveBeenCalledWith('path');
            expect(mkdirSyncSpy).not.toHaveBeenCalled();
        });
        it('should do nothing if the folderName is empty', () => {
            const existsSyncSpy = jest.spyOn(mockFS, 'existsSync');
            const mkdirSyncSpy = jest.spyOn(mockFS, 'mkdirSync');

            FileManager.createFolderIfNotExistsSync('');

            expect(existsSyncSpy).not.toHaveBeenCalled();
            expect(mkdirSyncSpy).not.toHaveBeenCalled();
        });
    });
    describe('createFolderStructureIfNeeded', function () {
        it('should not call anything on the last segment', () => {
            const createFolderIfNotExistsSyncSpy = jest.spyOn(FileManager, 'createFolderIfNotExistsSync');

            FileManager.createFolderStructureIfNeeded(['a', 'test', 'path.csv'].join(Path.sep), 2);

            expect(createFolderIfNotExistsSyncSpy).not.toHaveBeenCalled();
        });
        it('should call the other methods on the upper segments', () => {
            const createFolderIfNotExistsSyncSpy = jest.spyOn(FileManager, 'createFolderIfNotExistsSync');

            FileManager.createFolderStructureIfNeeded(['a', 'test', 'path.csv'].join(Path.sep), 1);

            expect(createFolderIfNotExistsSyncSpy).toHaveBeenCalledWith('a/test');
            expect(createFolderIfNotExistsSyncSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('deleteTempFolder', function () {
        it('should call rmdirSync', () => {
            const rmdirSyncSpy = jest.spyOn(mockFS, 'rmdirSync');

            FileManager.deleteTempFolder('path');

            expect(rmdirSyncSpy).toHaveBeenCalledWith(Path.resolve('./temp/path'), { recursive: true });
        });
    });
});
