import {jest} from '@jest/globals';

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
jest.mock('../../src/file-manager', () => ({FileManager: mockFileManager}));

import path from 'path';

const localDBFile = path.resolve('./db/db.json');
import {ConfigManager} from '../../src/config-manager';

describe('config-manager', function () {
    describe('getConfig', () => {
        it('should read and return the file if found and valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            ConfigManager.getConfig();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
        });
        it('should write a file and return {} if file not found', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => {
                    throw new Error('Error');
                });
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            ConfigManager.getConfig();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should write a file and return {} if file not valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{config: {}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            ConfigManager.getConfig();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
    });
    describe('addToConfig', () => {
        it('should add onto the existing config', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            ConfigManager.addToConfig('config',
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
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should remove the one config passed as parameter', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            await ConfigManager.removeFromConfig({name: 'config'});

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should remove all configs if no parameter passed and confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({all: true}));

            await ConfigManager.removeFromConfig({name: ''});

            expect(promptSpy).toHaveBeenCalledTimes(1);
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should not remove all configs if no parameter passed and not confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({all: false}));

            await ConfigManager.removeFromConfig({name: ''});

            expect(promptSpy).toHaveBeenCalled();
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).not.toHaveBeenCalledWith(localDBFile, '{}');
        });
    });
    describe('doesConfigExist', () => {
        it('should return true if it exists', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');

            const response = ConfigManager.doesConfigExist('config');

            expect(response).toEqual(true);
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
        });
        it('should return false if it does not exist', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');

            const response = ConfigManager.doesConfigExist('otherConfig');

            expect(response).toEqual(false);
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
        });
    });
});
