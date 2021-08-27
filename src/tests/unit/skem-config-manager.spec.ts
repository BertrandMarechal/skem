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
});
