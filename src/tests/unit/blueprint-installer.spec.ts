import { SkemOptions } from '../../command-line-args';
import { jest } from '@jest/globals';
import { BlueprintInstaller } from '../../blueprint-installer';
import { SkemConfig, SkemConfigManager, SkemHook } from '../../skem-config-manager';
import { SkemBlueprint } from '../../blueprint-manager';
import { VariableManager } from '../../variable-manager';
import { FileManager } from '../../file-manager';
import { UserInterface } from '../../user-interface';
import Path from 'path';

const defaultOptions: Pick<SkemOptions, 'path' | 'name' | 'variable' | 'force' | 'pick'> = {
    path: 'path',
    name: '',
    variable: ['var1=theVar'],
    force: false,
    pick: undefined,
};
const defaultHooks: SkemHook[] = [
    new SkemHook({ path: '.', type: 'post-install', command: 'npm i' }),
    new SkemHook({ path: '.', type: 'pre-install', command: 'npm init' }),
];
const defaultVariableValues = {
    var1: 'theVar'
};
const defaultConfig: SkemBlueprint = {
    name: 'config',
    files: [],
    hooks: [],
    variables: {
        variables: ['var1'],
        fileVariables: { 0: ['var1'] },
        variablesInFiles: [
            { file: 'file1', name: 'var1' },
        ],
    },
    isFile: false,
    root: 'root',
};

class MockConfigManager {
    async chooseConfiguration(_params: Pick<SkemOptions, 'name'>) {
        return null;
    }
}

const mockConfigManager = new MockConfigManager();
jest.mock('../../blueprint-manager', () => ({
    BlueprintManager: jest.fn(() => mockConfigManager)
}));

describe('blueprint-installer', function () {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('install', function () {
        it('should not do a thing if we cannot find the config', async () => {
            const chooseConfigurationSpy = jest.spyOn(mockConfigManager, 'chooseConfiguration');

            await new BlueprintInstaller().install({
                ...defaultOptions,
                name: 'doesNotExist'
            });

            expect(chooseConfigurationSpy).toHaveBeenCalledWith({ name: 'doesNotExist' });
        });
        it('should run pre-install and post-install hooke', async () => {
            const chooseConfigurationSpy = jest.spyOn(mockConfigManager, 'chooseConfiguration')
                .mockImplementationOnce(async (_params) => ({
                    ...defaultConfig,
                    hooks: defaultHooks,
                    variables: { variables: [] }
                }) as any);
            const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                .mockImplementation(jest.fn());

            await new BlueprintInstaller().install({
                ...defaultOptions,
                name: 'config',
            });

            expect(runHooksSpy).toHaveBeenCalledWith(defaultHooks, 'pre-install', 'path');
            expect(runHooksSpy).toHaveBeenCalledWith(defaultHooks, 'post-install', 'path');
            expect(chooseConfigurationSpy).toHaveBeenCalledWith({ name: 'config' });
            runHooksSpy.mockReset();
        });
        describe('single file', function () {
            it('should install a singleFile if it does not exist', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        isFile: true,
                        root: 'root/file.ts'
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementationOnce(() => 'newFileName');
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementationOnce(() => false);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementationOnce(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementationOnce(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newFileName'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    'root/file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
            });
            it('should install a singleFile and overwrite if we force', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        isFile: true,
                        root: 'root/file.ts'
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementationOnce(() => 'newFileName');
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementationOnce(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementationOnce(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementationOnce(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                    force: true,
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newFileName'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    'root/file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
            });
            it('should install a singleFile after confirmation to overwrite', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        isFile: true,
                        root: 'root/file.ts'
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementationOnce(() => 'newFileName');
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementationOnce(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile')
                    .mockImplementationOnce(async () => true);
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementationOnce(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementationOnce(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(confirmOverwriteOfFileSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newFileName'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    'root/file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
            });
            it('should not install a singleFile after denied to overwrite', async () => {

                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        isFile: true,
                        root: 'root/file.ts'
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementationOnce(() => 'newFileName');
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementationOnce(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile')
                    .mockImplementationOnce(async () => false);
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync');
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file.ts',
                    defaultConfig.variables.variables,
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(confirmOverwriteOfFileSpy).toHaveBeenCalledWith(Path.resolve('path', 'newFileName'));
                expect(writeFileSyncSpy).not.toHaveBeenCalled;
                expect(replaceVariablesInFileSpy).not.toHaveBeenCalled;
                runHooksSpy.mockReset();
            });
        });
        describe('directory', function () {
            it('should install the files if they do not exist', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        root: 'root',
                        files: ['file1', 'file2']
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementation((fileName) => `new${fileName}`);
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementation(() => false);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementation(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementation(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file1',
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file2',
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile1'),
                    'file content'
                );
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile2'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file1'),
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file2'),
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
                replaceVariableInFileNameSpy.mockReset();
                existsSpy.mockReset();
                writeFileSyncSpy.mockReset();
                replaceVariablesInFileSpy.mockReset();
                runHooksSpy.mockReset();
            });
            it('should install and overwrite if we force', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        root: 'root',
                        files: ['file1', 'file2']
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementation((fileName) => `new${fileName}`);
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementation(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementation(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementation(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                    force: true,
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file1',
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file2',
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile1'),
                    'file content'
                );
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile2'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file1'),
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file2'),
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
                replaceVariableInFileNameSpy.mockReset();
                existsSpy.mockReset();
                writeFileSyncSpy.mockReset();
                replaceVariablesInFileSpy.mockReset();
                runHooksSpy.mockReset();
            });
            it('should install the files after confirmation to overwrite', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        root: 'root',
                        files: ['file1', 'file2']
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementation((fileName) => `new${fileName}`);
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementation(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile')
                    .mockImplementation(async () => true);
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                    .mockImplementation(jest.fn());
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                    .mockImplementation(() => 'file content');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file1',
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file2',
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                expect(confirmOverwriteOfFileSpy).toHaveBeenCalledTimes(2);
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile1'),
                    'file content'
                );
                expect(writeFileSyncSpy).toHaveBeenCalledWith(
                    Path.resolve('path', 'newfile2'),
                    'file content'
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file1'),
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                    Path.resolve('root', 'file2'),
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                runHooksSpy.mockReset();
                replaceVariableInFileNameSpy.mockReset();
                existsSpy.mockReset();
                writeFileSyncSpy.mockReset();
                replaceVariablesInFileSpy.mockReset();
                runHooksSpy.mockReset();
            });
            it('should not install the files after denied to overwrite', async () => {
                jest.spyOn(mockConfigManager, 'chooseConfiguration')
                    .mockImplementationOnce(async (_params) => ({
                        ...defaultConfig,
                        root: 'root',
                        files: ['file1', 'file2']
                    }) as any);
                const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                    .mockImplementation(jest.fn());
                const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                    .mockImplementation((fileName) => `new${fileName}`);
                const existsSpy = jest.spyOn(FileManager, 'exists')
                    .mockImplementation(() => true);
                const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile')
                    .mockImplementation(async () => false);
                const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync');
                const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile');

                await new BlueprintInstaller().install({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file1',
                    defaultConfig.variables.fileVariables[0],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                    'file2',
                    [],
                    defaultVariableValues,
                    ['___', '___']
                );
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                expect(confirmOverwriteOfFileSpy).toHaveBeenCalledTimes(2);
                expect(writeFileSyncSpy).not.toHaveBeenCalled();
                expect(writeFileSyncSpy).not.toHaveBeenCalled();
                expect(replaceVariablesInFileSpy).not.toHaveBeenCalled();
                expect(replaceVariablesInFileSpy).not.toHaveBeenCalled();

                runHooksSpy.mockReset();
                replaceVariableInFileNameSpy.mockReset();
                existsSpy.mockReset();
                writeFileSyncSpy.mockReset();
                replaceVariablesInFileSpy.mockReset();
                runHooksSpy.mockReset();
            });
            describe('pick', function () {
                it('should install the files that were picked', async () => {
                    jest.spyOn(mockConfigManager, 'chooseConfiguration')
                        .mockImplementationOnce(async (_params) => ({
                            ...defaultConfig,
                            root: 'root',
                            files: ['file1', 'file2']
                        }) as any);
                    const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                        .mockImplementation(jest.fn());
                    const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                        .mockImplementation((fileName) => `new${fileName}`);
                    const existsSpy = jest.spyOn(FileManager, 'exists')
                        .mockImplementation(() => false);
                    const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                    const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                        .mockImplementation(jest.fn());
                    const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                        .mockImplementation(() => 'file content');
                    const selectFilesToInstallSpy = jest.spyOn(UserInterface, 'selectFilesToInstall')
                        .mockImplementationOnce(async () => ['file2']);
    
                    await new BlueprintInstaller().install({
                        ...defaultOptions,
                        name: 'config',
                        pick: 'file'
                    });
    
                    expect(replaceVariableInFileNameSpy).toHaveBeenCalledTimes(1);
                    expect(replaceVariableInFileNameSpy).not.toHaveBeenCalledWith(
                        'file1',
                        defaultConfig.variables.fileVariables[0],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                        'file2',
                        [],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(existsSpy).toHaveBeenCalledTimes(1);
                    expect(existsSpy).not.toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                    expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                    expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
                    expect(writeFileSyncSpy).not.toHaveBeenCalledWith(
                        Path.resolve('path', 'newfile1'),
                        'file content'
                    );
                    expect(writeFileSyncSpy).toHaveBeenCalledWith(
                        Path.resolve('path', 'newfile2'),
                        'file content'
                    );
                    expect(replaceVariablesInFileSpy).toHaveBeenCalledTimes(1);
                    expect(replaceVariablesInFileSpy).not.toHaveBeenCalledWith(
                        Path.resolve('root', 'file1'),
                        defaultConfig.variables.fileVariables[0],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                        Path.resolve('root', 'file2'),
                        [],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(selectFilesToInstallSpy).toHaveBeenCalledWith(['file1', 'file2']);
                    runHooksSpy.mockReset();
                    replaceVariableInFileNameSpy.mockReset();
                    existsSpy.mockReset();
                    writeFileSyncSpy.mockReset();
                    replaceVariablesInFileSpy.mockReset();
                    runHooksSpy.mockReset();
                });
                it('should install the files that was picked', async () => {
                    jest.spyOn(mockConfigManager, 'chooseConfiguration')
                        .mockImplementationOnce(async (_params) => ({
                            ...defaultConfig,
                            root: 'root',
                            files: ['file1', 'file2']
                        }) as any);
                    const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                        .mockImplementation(jest.fn());
                    const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName')
                        .mockImplementation((fileName) => `new${fileName}`);
                    const existsSpy = jest.spyOn(FileManager, 'exists')
                        .mockImplementation(() => false);
                    const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                    const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync')
                        .mockImplementation(jest.fn());
                    const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile')
                        .mockImplementation(() => 'file content');
    
                    await new BlueprintInstaller().install({
                        ...defaultOptions,
                        name: 'config',
                        pick: '1'
                    });
    
                    expect(replaceVariableInFileNameSpy).toHaveBeenCalledTimes(1);
                    expect(replaceVariableInFileNameSpy).toHaveBeenCalledWith(
                        'file1',
                        defaultConfig.variables.fileVariables[0],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(replaceVariableInFileNameSpy).not.toHaveBeenCalledWith(
                        'file2',
                        [],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(existsSpy).toHaveBeenCalledTimes(1);
                    expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', 'newfile1'));
                    expect(existsSpy).not.toHaveBeenCalledWith(Path.resolve('path', 'newfile2'));
                    expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                    expect(writeFileSyncSpy).toHaveBeenCalledTimes(1);
                    expect(writeFileSyncSpy).toHaveBeenCalledWith(
                        Path.resolve('path', 'newfile1'),
                        'file content'
                    );
                    expect(writeFileSyncSpy).not.toHaveBeenCalledWith(
                        Path.resolve('path', 'newfile2'),
                        'file content'
                    );
                    expect(replaceVariablesInFileSpy).toHaveBeenCalledTimes(1);
                    expect(replaceVariablesInFileSpy).toHaveBeenCalledWith(
                        Path.resolve('root', 'file1'),
                        defaultConfig.variables.fileVariables[0],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    expect(replaceVariablesInFileSpy).not.toHaveBeenCalledWith(
                        Path.resolve('root', 'file2'),
                        [],
                        defaultVariableValues,
                        ['___', '___']
                    );
                    runHooksSpy.mockReset();
                    replaceVariableInFileNameSpy.mockReset();
                    existsSpy.mockReset();
                    writeFileSyncSpy.mockReset();
                    replaceVariablesInFileSpy.mockReset();
                    runHooksSpy.mockReset();
                });
                it('should not install the files if none were picked', async () => {
                    jest.spyOn(mockConfigManager, 'chooseConfiguration')
                        .mockImplementationOnce(async (_params) => ({
                            ...defaultConfig,
                            root: 'root',
                            files: ['file1', 'file2']
                        }) as any);
                    const runHooksSpy = jest.spyOn(SkemConfigManager, 'runHooks')
                        .mockImplementation(jest.fn());
                    const replaceVariableInFileNameSpy = jest.spyOn(VariableManager, 'replaceVariableInFileName');
                    const existsSpy = jest.spyOn(FileManager, 'exists');
                    const confirmOverwriteOfFileSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfFile');
                    const writeFileSyncSpy = jest.spyOn(FileManager, 'writeFileSync');
                    const replaceVariablesInFileSpy = jest.spyOn(VariableManager, 'replaceVariablesInFile');
                    const exitSpy = jest.spyOn(process, 'exit').mockImplementationOnce(jest.fn());
    
                    await new BlueprintInstaller().install({
                        ...defaultOptions,
                        name: 'config',
                        pick: 'pick'
                    });
    
                    expect(replaceVariableInFileNameSpy).not.toHaveBeenCalled();
                    expect(existsSpy).not.toHaveBeenCalled();
                    expect(confirmOverwriteOfFileSpy).not.toHaveBeenCalled();
                    expect(writeFileSyncSpy).not.toHaveBeenCalled();
                    expect(replaceVariablesInFileSpy).not.toHaveBeenCalled();
                    expect(exitSpy).toHaveBeenCalledWith(1);
                    runHooksSpy.mockReset();
                    replaceVariableInFileNameSpy.mockReset();
                    existsSpy.mockReset();
                    writeFileSyncSpy.mockReset();
                    replaceVariablesInFileSpy.mockReset();
                    runHooksSpy.mockReset();
                });
            });
        });
    });
});
