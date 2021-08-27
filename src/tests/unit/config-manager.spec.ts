import { jest } from '@jest/globals';

const mockFS = {
    readFileSync: jest.fn(),
};
const mockInquirer = {
    prompt: jest.fn(),
};
const mockFileManager = {
    writeFileSync: jest.fn(),
};
jest.mock('fs', () => mockFS);
jest.mock('inquirer', () => mockInquirer);
jest.mock('../../file-manager', () => ({ FileManager: mockFileManager }));

import path from 'path';

const localDBFile = path.resolve('./db/db.json');
import { ConfigManager } from '../../config-manager';

describe('config-manager', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should read and return the file if found and valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            new ConfigManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
        });
        it('should write a file and return {} if file not found', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => {
                    throw new Error('Error');
                });
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            new ConfigManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should write a file and return {} if file not valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{config: {}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            new ConfigManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
    });
    describe('config', () => {
        it('should return the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            const configManager = new ConfigManager();

            expect(configManager.config.config).toBeTruthy();
        });
    });
    describe('configNames', () => {
        it('should return the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            const configManager = new ConfigManager();

            expect(configManager.configNames[0]).toEqual('config');
        });
    });
    describe('addToConfig', () => {
        it('should add onto the existing config', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            const configManager = new ConfigManager();

            configManager.addToConfig('config',
                {
                    files: [],
                    isFile: false,
                    name: '',
                    preferredPackageManager: 'npm',
                    root: '',
                    variables: {
                        variables: [],
                        fileVariables: {},
                        variablesInFiles: []
                    },
                }
            );

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, JSON.stringify({
                config: {
                    files: [],
                    isFile: false,
                    name: '',
                    preferredPackageManager: 'npm',
                    root: '',
                    variables: {
                        variables: [],
                        fileVariables: {},
                        variablesInFiles: []
                    },
                }
            }));
        });
    });
    describe('removeFromConfig', () => {
        it('should remove the one config passed as parameter', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            const configManager = new ConfigManager();
            await configManager.removeFromConfig({ name: 'config' });

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should remove all configs if no parameter passed and confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({ all: true }));

            const configManager = new ConfigManager();
            await configManager.removeFromConfig({ name: '' });

            expect(promptSpy).toHaveBeenCalledTimes(1);
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should not remove all configs if no parameter passed and not confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({ all: false }));

            const configManager = new ConfigManager();
            await configManager.removeFromConfig({ name: '' });

            expect(promptSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).not.toHaveBeenCalledWith(localDBFile, '{}');
        });
    });
    describe('exitIfConfigDoesNotExist', () => {
        it('should not exit if it exists', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const configManager = new ConfigManager();
            configManager.exitIfConfigDoesNotExist('config');

            expect(exitSpy).not.toHaveBeenCalled();
        });
        it('should exit if it does not exists', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const configManager = new ConfigManager();
            configManager.exitIfConfigDoesNotExist('otherConfig');

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
    });
});
