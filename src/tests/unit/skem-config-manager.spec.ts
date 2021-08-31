import { jest } from '@jest/globals';

const mockFS = {
    readFileSync: jest.fn(),
};
jest.mock('fs', () => mockFS);

import { SkemConfigManager } from '../../skem-config-manager';

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
    describe('getFileNameVariableWrapper', () => {
        it('should return the default if fileNameVariableWrapper not provided', () => {
            expect(SkemConfigManager.getFileNameVariableWrapper({})).toEqual(['___', '___']);
        });
        it('should return the provided one if fileNameVariableWrapper provided', () => {
            expect(SkemConfigManager.getFileNameVariableWrapper({ fileNameVariableWrapper: '{{{}}}' })).toEqual(['{{{', '}}}']);
        });
    });
    describe('getVariableWrapper', () => {
        it('should return the default if no variableWrapper(s) not provided', () => {
            expect(SkemConfigManager.getVariableWrapper('', {})).toEqual(['___', '___']);
        });
        it('should return the variableWrapper if no variableWrappers not provided', () => {
            expect(SkemConfigManager.getVariableWrapper('', { variableWrapper: '{{{}}}' })).toEqual(['{{{', '}}}']);
        });
        it('should return the variableWrapper if no variableWrappers match', () => {
            expect(SkemConfigManager.getVariableWrapper('js', {
                variableWrapper: '{{{}}}',
                variableWrappers: [{ wrapper: '<<<>>>', extension: 'json' }]
            })).toEqual(['{{{', '}}}']);
        });
        it('should return the correct variableWrapper if it match', () => {
            expect(SkemConfigManager.getVariableWrapper('json', {
                variableWrapper: '{{{}}}',
                variableWrappers: [{ wrapper: '<<<>>>', extension: 'json' }]
            })).toEqual(['<<<', '>>>']);
        });
    });
    describe('_validateConfig', () => {
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
});
