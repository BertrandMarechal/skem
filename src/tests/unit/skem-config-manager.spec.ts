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
                .mockImplementationOnce(() => JSON.stringify({ }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.name).toEqual('');
        });
    });
    describe('isSingleFiles', () => {
        it('returns true if singleFile is provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({ singleFile: 'blueprint' }));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFiles).toEqual(true);
        });
        it('returns false if singleFile is not provided in the config', () => {
            jest.spyOn(mockFS, 'readFileSync')
                .mockImplementationOnce(() => JSON.stringify({}));

            const skemConfigManager = new SkemConfigManager('fileName');

            expect(skemConfigManager.isSingleFiles).toEqual(false);
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
