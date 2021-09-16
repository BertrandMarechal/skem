import { jest } from '@jest/globals';
import child_process from 'child_process';

const mockFS = {
    readFileSync: jest.fn(),
};
jest.mock('fs', () => mockFS);
jest.mock('child_process');

import { SkemConfigManager, SkemHook } from '../../skem-config-manager';
import { VariableTransformParams } from '../../variable-transformer';

describe('skem-config-manager', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should read and return the file if found and valid', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{"name":"blueprint"}');

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(readFileSyncSpy).toHaveBeenCalledWith('fileName', 'ascii');
            expect(skemConfigManager.name).toEqual('blueprint');
        });
        it('should read and stop if the file is empty', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '');

            new SkemConfigManager('fileName');

            expect(readFileSyncSpy).toHaveBeenCalledWith('fileName', 'ascii');
        });
        it('should not read the file if name is not truthy', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync');

            const skemConfigManager = new SkemConfigManager('');

            expect(readFileSyncSpy).not.toHaveBeenCalled();
            expect(skemConfigManager.name).toEqual('');
        });
        it('should read a file and return "" for name if file not found', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => {
                    throw new Error('error');
                });

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(readFileSyncSpy).toHaveBeenCalledWith('fileName', 'ascii');
            expect(skemConfigManager.name).toEqual('');
        });
        it('should read a file and return "" for name if file not found', () => {
            const readFileSyncSpy = jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => '{config: {}}');

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(readFileSyncSpy).toHaveBeenCalledWith('fileName', 'ascii');
            expect(skemConfigManager.name).toEqual('');
        });
    });
    describe('name', () => {
        it('returns the name provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ name: 'blueprint' }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.name).toEqual('blueprint');
        });
        it('returns "" if no name provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.name).toEqual('');
        });
    });
    describe('isSingleFile', () => {
        it('returns true if singleFile is provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFile: 'blueprint' }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFile).toEqual(true);
        });
        it('returns false if singleFile is not provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFile).toEqual(false);
        });
    });
    describe('isSingleFiles', () => {
        it('returns true if singleFiles is provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFiles: ['blueprint'] }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFiles).toEqual(true);
        });
        it('returns false if singleFiles is provided empty in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFiles: [] }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFiles).toEqual(false);
        });
        it('returns false if singleFiles is not provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFiles).toEqual(false);
        });
    });
    describe('singleFiles', () => {
        it('should return empty array if no single files were set up', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));

            const skemConfigManager = new SkemConfigManager('fileName');
            const singleFiles = skemConfigManager.singleFiles;

            expect(singleFiles.length).toEqual(0);
        });
        it('should return the single file that was set up', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFile: 'blueprint', name: 'test' }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const singleFiles = skemConfigManager.singleFiles;

            expect(singleFiles.length).toEqual(1);
            expect(singleFiles[0].file).toEqual('blueprint');
            expect(singleFiles[0].name).toEqual('test');
        });
        it('should return the single files that were set up', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFiles: [{ file: 'blueprint', name: 'test' }] }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const singleFiles = skemConfigManager.singleFiles;

            expect(singleFiles.length).toEqual(1);
            expect(singleFiles[0].file).toEqual('blueprint');
            expect(singleFiles[0].name).toEqual('test');
        });
    });
    describe('skemWrappers', () => {
        it('should return the fileNameVariableWrapper if only this one was set', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ fileNameVariableWrapper: '-variable-' }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const skemWrappers = skemConfigManager.skemWrappers;

            expect(Object.keys(skemWrappers).length).toEqual(1);
            expect(skemWrappers.fileNameVariableWrapper).toEqual('-variable-');
        });
        it('should return the variableWrapper if only this one was set', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ variableWrapper: '-variable-' }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const skemWrappers = skemConfigManager.skemWrappers;

            expect(Object.keys(skemWrappers).length).toEqual(1);
            expect(skemWrappers.variableWrapper).toEqual('-variable-');
        });
        it('should return the variableWrappers if only this one was set', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ variableWrappers: [] }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const skemWrappers = skemConfigManager.skemWrappers;

            expect(Object.keys(skemWrappers).length).toEqual(1);
            expect(skemWrappers.variableWrappers).toEqual([]);
        });
        it('should return all if all were set was set', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({
                    fileNameVariableWrapper: '-variable-',
                    variableWrapper: '-variable-',
                    variableWrappers: []
                }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const skemWrappers = skemConfigManager.skemWrappers;

            expect(Object.keys(skemWrappers).length).toEqual(3);
            expect(skemWrappers.fileNameVariableWrapper).toEqual('-variable-');
            expect(skemWrappers.variableWrapper).toEqual('-variable-');
            expect(skemWrappers.variableWrappers).toEqual([]);
        });
    });
    describe('hooks', () => {
        it('should return the ones set up in the file', () => {
            const hooks = [
                { command: 'npm i', path: '.', type: 'pre-install' },
            ];
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ hooks }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const hookResponse = skemConfigManager.hooks;

            expect(hookResponse.length).toEqual(1);
            expect(hookResponse[0].command).toEqual(hooks[0].command);
        });
    });
    describe('variableTransform', () => {
        it('should return the ones set up in the file', () => {
            const variableTransform: Record<string, VariableTransformParams> = {
                var2: {
                    transform: 'camelCase(var1)'
                }
            };
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ variableTransform }));

            const skemConfigManager = new SkemConfigManager('fileName');
            const variableTransformResponse = skemConfigManager.variableTransform;

            expect(variableTransformResponse).toEqual({
                var2: {
                    transform: 'camelCase(var1)',
                    dependencies: ['var1']
                }
            });
        });
    });
    describe('getFileNameVariableWrapper', () => {
        it('should return the default if fileNameVariableWrapper not provided', () => {
            expect(SkemConfigManager.getFileNameVariableWrapper({})).toEqual(['___', '___']);
        });
        it('should return the provided one if fileNameVariableWrapper provided', () => {
            expect(SkemConfigManager.getFileNameVariableWrapper({ fileNameVariableWrapper: '{{{variable}}}' })).toEqual(['{{{', '}}}']);
        });
    });
    describe('getVariableWrapper', () => {
        it('should return the default if no variableWrapper(s) not provided', () => {
            expect(SkemConfigManager.getVariableWrapper('', {})).toEqual(['___', '___']);
        });
        it('should return the variableWrapper if no variableWrappers not provided', () => {
            expect(SkemConfigManager.getVariableWrapper('', { variableWrapper: '{{{variable}}}' })).toEqual(['{{{', '}}}']);
        });
        it('should return the variableWrapper if no variableWrappers match', () => {
            expect(SkemConfigManager.getVariableWrapper('js', {
                variableWrapper: '{{{variable}}}',
                variableWrappers: [{ wrapper: '<<<variable>>>', extension: 'json' }]
            })).toEqual(['{{{', '}}}']);
        });
        it('should return the correct variableWrapper if it match', () => {
            expect(SkemConfigManager.getVariableWrapper('json', {
                variableWrapper: '{{{variable}}}',
                variableWrappers: [{ wrapper: '<<<variable>>>', extension: 'json' }]
            })).toEqual(['<<<', '>>>']);
        });
    });
    describe('runHooks', () => {
        it('should only run the hooks from a certain type', () => {
            const execSyncSpy = jest.spyOn(child_process, 'execSync')
                .mockImplementationOnce(jest.fn());
            SkemConfigManager.runHooks([
                new SkemHook(
                    {
                        type: 'pre-install',
                        command: 'npm install',
                        path: '.'
                    }
                ),
                new SkemHook(
                    {
                        type: 'post-install',
                        command: 'npm install',
                        path: '.'
                    }
                )
            ], 'pre-install', '.');

            expect(execSyncSpy).toHaveBeenCalledTimes(1);
        });
    });
    describe('_validateConfig', () => {
        describe('singleFile', function () {

            it('should not allow singleFile and singleFiles', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        singleFile: 'singleFile',
                        singleFiles: [{ name: 'singleFile1', file: 'singleFile1' }],
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
        });
        describe('wrappers', function () {

            it('should not allow an invalid fileNameVariableWrapper', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        fileNameVariableWrapper: '---',
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
            it('should not allow an invalid variableWrapper', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        variableWrapper: '---',
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
            it('should not allow a invalid variableWrappers', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        variableWrappers: [{ extrnsion: 'js', wrapper: '---' }],
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
            it('should not allow multiple variableWrappers with same extension', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        variableWrappers: [{ extrnsion: 'js', wrapper: '-variable-' }, { extrnsion: 'js', wrapper: '__variable__' }],
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
        });
        describe('hooks', function () {
            it('should not badly set up hooks on bad type', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        hooks: [{ type: 'test', command: 'npm install' }],
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
            it('should not badly set up hooks on empty command', () => {
                jest.spyOn(mockFS, 'readFileSync')
                    .mockImplementationOnce(() => JSON.stringify({
                        hooks: [{ type: 'pre-install', command: '' }],
                    }));
                const exitSpy = jest.spyOn(process, 'exit')
                    .mockImplementationOnce(jest.fn());

                new SkemConfigManager('fileName');

                expect(exitSpy).toHaveBeenCalledWith(1);
            });
        });
    });
});
