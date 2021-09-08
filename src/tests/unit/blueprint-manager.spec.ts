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
const configToPrint = {
    name: 'config',
    root: 'root',
    variables: {
        variables: []
    },
    files: [],
};
import path from 'path';

const localDBFile = path.resolve('./db/db.json');
import { BlueprintManager } from '../../blueprint-manager';
import { UserInterface } from '../../user-interface';

describe('blueprint-manager', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should read and return the file if found and valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            new BlueprintManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
        });
        it('should write a file and return {} if file not found', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => {
                    throw new Error('Error');
                });
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            new BlueprintManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should write a file and return {} if file not valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{config: {}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            new BlueprintManager();

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
    });
    describe('config', () => {
        it('should return the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            const configManager = new BlueprintManager();

            expect(configManager.config.config).toBeTruthy();
        });
    });
    describe('configNames', () => {
        it('should return the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config": {}}');

            const configManager = new BlueprintManager();

            expect(configManager.configNames[0]).toEqual('config');
        });
    });
    describe('chooseConfiguration', () => {
        it('should exit if config has no blueprints', async () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const bluePrintManager = new BlueprintManager();
            await bluePrintManager.chooseConfiguration({ name: '' });

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should select the one that has been passed as parameter', async () => {
            const config = { the: 'config' };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ config }));

            const bluePrintManager = new BlueprintManager();
            const result = await bluePrintManager.chooseConfiguration({ name: 'config' });

            expect(result).toEqual(config);
        });
        it('should exit if the one passed as parameter cannot be found', async () => {
            const config = { the: 'config' };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ config }));
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const bluePrintManager = new BlueprintManager();
            await bluePrintManager.chooseConfiguration({ name: 'other-config' });

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
        it('should select the one that is available if one only and no filter', async () => {
            const config = { the: 'config' };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ config }));

            const bluePrintManager = new BlueprintManager();
            const result = await bluePrintManager.chooseConfiguration({ name: '' });

            expect(result).toEqual(config);
        });
        it('should select the one that is available if more than one but one is filtered', async () => {
            const config = { the: 'config' };
            const other = { the: 'other' };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ config, other }));

            const bluePrintManager = new BlueprintManager();
            const result = await bluePrintManager.chooseConfiguration({ name: 'config' });

            expect(result).toEqual(config);
        });
        it('should select the one selected by the user when prompted', async () => {
            const config = { the: 'config' };
            const other = { the: 'other' };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ config, other }));
            const selectBlueprintSpy = jest.spyOn(UserInterface, 'selectBlueprint')
                .mockImplementationOnce(async () => 'other');

            const bluePrintManager = new BlueprintManager();
            const result = await bluePrintManager.chooseConfiguration({ name: '' });

            expect(selectBlueprintSpy).toHaveBeenCalledWith(['config', 'other']);
            expect(result).toEqual(other);
        });
    });
    describe('printConfiguration', () => {
        describe('files', () => {
            it('should contain files if is not a single file and has files', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            files: [
                                'file1'
                            ]
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Files') > -1).toEqual(true);
                expect(log.indexOf('- file1') > -1).toEqual(true);
            });
            it('should not contain files if is not a single file but has no file', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            files: []
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Files') > -1).toEqual(false);
            });
            it('should not contain files if is a single file, but contains Single File', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            isFile: true
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Files') > -1).toEqual(false);
                expect(log.indexOf('Single File') > -1).toEqual(true);
            });
        });
        describe('fileNameVariableWrapper', () => {
            it('should contain fileNameVariableWrapper if defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            fileNameVariableWrapper: '------'
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('File name variable wrapper') > -1).toEqual(true);
            });
            it('should not contain fileNameVariableWrapper if not defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('File name variable wrapper') > -1).toEqual(false);
            });
        });
        describe('variableWrapper', () => {
            it('should contain variableWrapper if defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            variableWrapper: '------'
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variable wrapper') > -1).toEqual(true);
            });
            it('should not contain variableWrapper if not defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variable wrappers') > -1).toEqual(false);
            });
        });
        describe('variableWrappers', () => {
            it('should contain Variable Wrappers if defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            variableWrappers: [
                                { wrapper: '{{{}}}', extension: 'js' },
                                { wrapper: '<>', extension: 'ts' },
                            ]
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variable wrappers') > -1).toEqual(true);
                expect(log.indexOf('- <> for "ts"') > -1).toEqual(true);
                expect(log.indexOf('- {{{}}} for "js"') > -1).toEqual(true);
            });
            it('should not contain Variable Wrappers if not defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variable wrappers') > -1).toEqual(false);
            });
            it('should not contain Variable Wrappers if defined but no records', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            variableWrappers: []
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variable wrappers') > -1).toEqual(false);
            });
        });
        describe('hooks', () => {
            it('should contain hooks if defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            hooks: [
                                { command: 'npm i', type: 'post-install', path: '.' },
                                { command: 'ls', type: 'pre-install', path: 'test' },
                            ]
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Hooks') > -1).toEqual(true);
                expect(log.indexOf('- "npm i" to run at "post-install" in "."') > -1).toEqual(true);
                expect(log.indexOf('- "ls" to run at "pre-install" in "test"') > -1).toEqual(true);
            });
            it('should not contain hooks if not defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Hooks') > -1).toEqual(false);
            });
            it('should not contain hooks if defined but no records', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            hooks: [],
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Hooks') > -1).toEqual(false);
            });
        });
        describe('variables', () => {
            it('should contain variables if defined', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            variables: {
                                variables: [
                                    'var 1',
                                    'var 2',
                                ]
                            },
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variables') > -1).toEqual(true);
                expect(log.indexOf('- var 1') > -1).toEqual(true);
                expect(log.indexOf('- var 2') > -1).toEqual(true);
            });
            it('should not contain variables if defined but no records', async () => {
                const logSpy = jest.spyOn(console, 'log');
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        config: {
                            ...configToPrint,
                            variables: {
                                variables: []
                            },
                        }
                    }));
                const bluePrintManager = new BlueprintManager();
                await bluePrintManager.printConfig({ name: 'config' });

                expect(logSpy).toHaveBeenCalled();
                const log = logSpy.mock.calls[0][0];
                expect(log.indexOf('Variables') > -1).toEqual(false);
            });
        });
    });
    describe('addToConfig', () => {
        it('should add onto the existing config', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            const configManager = new BlueprintManager();

            configManager.addToConfig('config',
                {
                    files: [],
                    isFile: false,
                    name: '',
                    root: '',
                    variables: {
                        variables: [],
                        fileVariables: {},
                        variablesInFiles: []
                    },
                    hooks: [],
                    variableTransform: {}
                }
            );

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, JSON.stringify({
                config: {
                    files: [],
                    isFile: false,
                    name: '',
                    root: '',
                    variables: {
                        variables: [],
                        fileVariables: {},
                        variablesInFiles: []
                    },
                    hooks: [],
                    variableTransform: {}
                }
            }));
        });
    });
    describe('removeFromConfig', () => {
        it('should remove the one config passed as parameter', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            const configManager = new BlueprintManager();
            await configManager.removeFromConfig({ name: 'config', force: false });

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should remove all configs if no parameter passed and confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({ all: true }));

            const configManager = new BlueprintManager();
            await configManager.removeFromConfig({ name: '', force: false });

            expect(promptSpy).toHaveBeenCalledTimes(1);
            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should not do a thing if no config found', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');

            const configManager = new BlueprintManager();
            await configManager.removeFromConfig({ name: '', force: false });

            expect(readFileSyncSpy).toHaveBeenCalledWith(localDBFile, 'ascii');
            expect(writeFileSyncSpy).not.toHaveBeenCalledWith(localDBFile, '{}');
        });
        it('should not remove all configs if no parameter passed and not confirmed', async () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{},"config2":{}}');
            const writeFileSyncSpy = jest.spyOn(mockFileManager, 'writeFileSync');
            const promptSpy = jest.spyOn(mockInquirer, 'prompt')
                .mockImplementationOnce(async () => ({ all: false }));

            const configManager = new BlueprintManager();
            await configManager.removeFromConfig({ name: '', force: false });

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

            const configManager = new BlueprintManager();
            configManager.exitIfConfigDoesNotExist('config');

            expect(exitSpy).not.toHaveBeenCalled();
        });
        it('should exit if it does not exists', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"config":{}}');
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            const configManager = new BlueprintManager();
            configManager.exitIfConfigDoesNotExist('otherConfig');

            expect(exitSpy).toHaveBeenCalledWith(1);
        });
    });
});
