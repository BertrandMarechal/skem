import colors from 'colors';
import { jest } from '@jest/globals';
import { SkemOptions } from '../../command-line-args';
import { FileManager } from '../../file-manager';
import Path from 'path';

const defaultOptions: SkemOptions = {
    name: '',
    all: false,
    command: 'help',
    force: false,
    help: false,
    ignore: '',
    path: '',
    pick: null,
    repo: false,
    variable: []
};

const defaultWrappers: SkemConfigWrappers = {
    fileNameVariableWrapper: 'fileNameVariableWrapper',
    variableWrapper: 'variableWrapper',
    variableWrappers: [
        { wrapper: 'wrap', extension: 'extension' }
    ]
};

class MockSkemConfigManager {
    get skemWrappers(): SkemConfigWrappers {
        return defaultWrappers;
    }

    get hooks(): SkemHook[] {
        return [];
    }

    get isSingleFiles(): boolean {
        return false;
    }

    get singleFiles(): { file: string, name?: string }[] {
        return [];
    }

    get isSingleFile() {
        return false;
    }
}

class MockConfigManager {
    get configNames(): string[] {
        return ['config1', 'config2'];
    }

    get config(): Record<string, any> {
        return {};
    }

    removeFromConfig(_params: Pick<SkemOptions, 'name' | 'force'>) {
        return null;
    }

    addToConfig(_configName: string, _config: SkemBlueprint): void {
        return;
    }

    printConfig(_params: Pick<SkemOptions, 'name'>) {
        return null;
    }

    exitIfConfigDoesNotExist(_name: string): boolean {
        return true;
    }
}

const mockConfigManager = new MockConfigManager();
jest.mock('../../blueprint-manager', () => ({
    BlueprintManager: jest.fn(() => mockConfigManager)
}));
jest.mock('uuid', () => ({ v4: () => 'uuid' }));
const mockChildProcess = {
    execSync: jest.fn(),
};
jest.mock('child_process', () => mockChildProcess);
jest.mock('uuid', () => ({ v4: () => 'uuid' }));


import { Skem } from '../../skem';
import { UserInterface } from '../../user-interface';
import { VariableManager } from '../../variable-manager';
import { SkemBlueprint, SkemVariables } from '../../blueprint-manager';
import { CONFIGURATION_FILE_NAME, SkemConfigWrappers, SkemHook } from '../../skem-config-manager';

describe('skem', function () {
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('extractConfigFromProject', function () {
        describe('no config', function () {
            describe('single file', function () {
                it('should create a brand new config if one does not exist', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => false);
                    const chooseValidNameForBlueprintSpy = jest.spyOn(UserInterface, 'chooseValidNameForBlueprint')
                        .mockImplementationOnce(async () => 'configName');
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({});
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => ['file.ts']);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    const addToConfigSpy = jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        name: '',
                        path: 'file.ts'
                    });

                    expect(chooseValidNameForBlueprintSpy).toHaveBeenCalled();
                    expect(getFileListSpy).toHaveBeenCalledWith(Path.resolve('file.ts'));
                    expect(addToConfigSpy).toHaveBeenCalledWith('configName', {
                        isFile: true,
                        name: 'configName',
                        root: Path.resolve('file.ts'),
                        files: [Path.resolve('file.ts')],
                        variables,
                        hooks: [],
                        variableTransform: {},
                    });
                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });
                it('should not ask for a config name if we provide one', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => false);
                    const chooseValidNameForBlueprintSpy = jest.spyOn(UserInterface, 'chooseValidNameForBlueprint');
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({});
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => ['file.ts']);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    const addToConfigSpy = jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        name: 'configName',
                        path: 'file.ts'
                    });

                    expect(chooseValidNameForBlueprintSpy).not.toHaveBeenCalled();
                    expect(addToConfigSpy).toHaveBeenCalledWith('configName', {
                        isFile: true,
                        name: 'configName',
                        root: Path.resolve('file.ts'),
                        files: [Path.resolve('file.ts')],
                        variables,
                        hooks: [],
                        variableTransform: {},
                    });
                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });
                it('should not ask for a config name if are looping on a folder', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => false);
                    const chooseValidNameForBlueprintSpy = jest.spyOn(UserInterface, 'chooseValidNameForBlueprint');
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({});
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => ['file.ts']);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    const addToConfigSpy = jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        folderNameFromLoop: 'configName',
                        path: 'file.ts'
                    });

                    expect(chooseValidNameForBlueprintSpy).not.toHaveBeenCalled();
                    expect(addToConfigSpy).toHaveBeenCalledWith('configName', {
                        isFile: true,
                        name: 'configName',
                        root: Path.resolve('file.ts'),
                        files: [Path.resolve('file.ts')],
                        variables,
                        hooks: [],
                        variableTransform: {},
                    });
                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });
                it('should ask for confirmation if the blueprint exists', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => false);
                    jest.spyOn(UserInterface, 'chooseValidNameForBlueprint')
                        .mockImplementationOnce(async () => 'configName');
                    const confirmOverwriteOfBlueprintOrExitSpy = jest.spyOn(UserInterface, 'confirmOverwriteOfBlueprintOrExit')
                        .mockImplementationOnce(jest.fn());
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({ configName: {} });
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => ['file.ts']);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        name: '',
                        path: 'file.ts'
                    });

                    expect(confirmOverwriteOfBlueprintOrExitSpy).toHaveBeenCalledWith('configName');

                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });
            });
            describe('directory', function () {
                it('should create a brand new config if it does not exist', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => true);
                    const existsSpy = jest.spyOn(FileManager, 'exists')
                        .mockImplementationOnce(() => false);
                    const overwriteFolderNameForBlueprintSpy = jest.spyOn(UserInterface, 'overwriteFolderNameForBlueprint')
                        .mockImplementationOnce(async () => 'configName');
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({});
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => [
                            Path.resolve('path', 'file1.ts'),
                            Path.resolve('path', 'file2.ts'),
                        ]);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    const addToConfigSpy = jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        name: '',
                        path: 'path'
                    });

                    expect(existsSpy).toHaveBeenCalledWith(Path.resolve('path', CONFIGURATION_FILE_NAME));
                    expect(overwriteFolderNameForBlueprintSpy).toHaveBeenCalledWith('');
                    expect(getFileListSpy).toHaveBeenCalledWith(Path.resolve('path'));
                    expect(addToConfigSpy).toHaveBeenCalledWith('configName', {
                        isFile: false,
                        name: 'configName',
                        root: Path.resolve('path'),
                        files: [
                            'file1.ts',
                            'file2.ts',
                        ],
                        variables,
                        hooks: [],
                        variableTransform: {},
                    });
                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });

            });
        });
        describe('with config', function () {
            describe('single file', function () {
                it('should include the wrappers from the config passed as parameter', async function () {
                    const isDirectorySpy = jest.spyOn(FileManager, 'isDirectory')
                        .mockImplementationOnce(() => false);
                    const chooseValidNameForBlueprintSpy = jest.spyOn(UserInterface, 'chooseValidNameForBlueprint');
                    jest.spyOn(mockConfigManager, 'config', 'get')
                        .mockReturnValueOnce({});
                    const getFileListSpy = jest.spyOn(FileManager, 'getFileList')
                        .mockImplementationOnce(() => ['file.ts']);
                    const variables: SkemVariables = {
                        variables: ['v1', 'v2'],
                        fileVariables: {}
                    };
                    const getVariablesSpy = jest.spyOn(VariableManager, 'getVariables')
                        .mockImplementationOnce(() => variables);
                    const addToConfigSpy = jest.spyOn(mockConfigManager, 'addToConfig');

                    const skem = new Skem();
                    const mockSkemConfigManager: any = new MockSkemConfigManager();
                    await skem.extractConfigFromProject({
                        ...defaultOptions,
                        name: 'configName',
                        path: 'file.ts'
                    }, mockSkemConfigManager);

                    expect(chooseValidNameForBlueprintSpy).not.toHaveBeenCalled();
                    expect(addToConfigSpy).toHaveBeenCalledWith('configName', {
                        isFile: true,
                        name: 'configName',
                        root: Path.resolve('file.ts'),
                        files: [Path.resolve('file.ts')],
                        variables,
                        ...defaultWrappers,
                        hooks: [],
                        variableTransform: {},
                    });
                    isDirectorySpy.mockReset();
                    getFileListSpy.mockReset();
                    getVariablesSpy.mockReset();
                });
            });
            describe('directory', function () {
                it.todo('should call extractConfigFromProject on all the singleFiles');
                it.todo('should call extractConfigFromProject on a singleFile');
            });
        });
    });
    describe('loopOnSubFoldersAndExtractConfigFromProject', function () {
        it('should loop on all the non ignored folders and call exitIfConfigDoesNotExist', async function () {
            const skem = new Skem();
            const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject')
                .mockImplementation(jest.fn());
            const getNonIgnoredFolderListSpy = jest.spyOn(FileManager, 'getNonIgnoredFolderList')
                .mockImplementationOnce(() => ['f1', 'f2', 'f3']);

            await skem.loopOnSubFoldersAndExtractConfigFromProject({
                ...defaultOptions,
                path: 'root'
            });

            expect(getNonIgnoredFolderListSpy).toHaveBeenCalledWith('root');
            expect(extractConfigFromProjectSpy).toHaveBeenCalledTimes(3);
            expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                ...defaultOptions,
                path: Path.resolve('root', 'f1'),
                folderNameFromLoop: 'f1'
            });
            expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                ...defaultOptions,
                path: Path.resolve('root', 'f2'),
                folderNameFromLoop: 'f2'
            });
            expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                ...defaultOptions,
                path: Path.resolve('root', 'f3'),
                folderNameFromLoop: 'f3'
            });
        });
    });
    describe('update', function () {
        describe('single blueprint', function () {
            it('should exit if the configuration does not exist', async function () {
                const skem = new Skem();
                const exitIfConfigDoesNotExistSpy = jest.spyOn(mockConfigManager, 'exitIfConfigDoesNotExist')
                    .mockImplementationOnce(() => false);
                const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject');

                await skem.update({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(extractConfigFromProjectSpy).not.toHaveBeenCalled();
                expect(exitIfConfigDoesNotExistSpy).toHaveBeenCalledWith('config');
                exitIfConfigDoesNotExistSpy.mockReset();
            });
            it('should not exit if the configuration exists and call the extract', async function () {
                const skem = new Skem();
                const exitIfConfigDoesNotExistSpy = jest.spyOn(mockConfigManager, 'exitIfConfigDoesNotExist')
                    .mockImplementationOnce(() => true);
                const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject')
                    .mockImplementationOnce(jest.fn());
                jest.spyOn(mockConfigManager, 'config', 'get')
                    .mockReturnValue({ config: { root: 'root' } });

                await skem.update({
                    ...defaultOptions,
                    name: 'config',
                });

                expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                    ...defaultOptions,
                    name: 'config',
                    isUpdate: true,
                    path: 'root'
                });
                expect(exitIfConfigDoesNotExistSpy).toHaveBeenCalledWith('config');
                exitIfConfigDoesNotExistSpy.mockReset();
            });
        });
        describe('multiple blueprints', function () {
            it('should log that there are no blueprints available', async function () {
                const skem = new Skem();
                const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject')
                    .mockImplementationOnce(jest.fn());
                jest.spyOn(mockConfigManager, 'configNames', 'get')
                    .mockReturnValue([]);
                const errorSpy = jest.spyOn(console, 'error');

                await skem.update({
                    ...defaultOptions,
                });

                expect(extractConfigFromProjectSpy).not.toHaveBeenCalled();
                expect(errorSpy).toHaveBeenCalledWith('Could not find any blueprints. Try to add one with "skem add".');
                errorSpy.mockReset();
            });
            it('should run for all available blueprints', async function () {
                const skem = new Skem();
                const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject')
                    .mockImplementation(jest.fn());
                jest.spyOn(mockConfigManager, 'configNames', 'get')
                    .mockReturnValue(['bp1', 'bp2']);
                jest.spyOn(mockConfigManager, 'config', 'get')
                    .mockReturnValue({ bp1: { root: 'root/bp1' }, bp2: { root: 'root/bp2' } });

                await skem.update({
                    ...defaultOptions,
                });

                expect(extractConfigFromProjectSpy).toHaveBeenCalledTimes(2);
                expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                    ...defaultOptions,
                    name: 'bp1',
                    isUpdate: true,
                    path: 'root/bp1'
                });
                expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                    ...defaultOptions,
                    name: 'bp2',
                    isUpdate: true,
                    path: 'root/bp2'
                });
            });
        });
    });
    describe('listConfigs', function () {
        it('should log the fact that there is nothing to be shown', async function () {
            jest.spyOn(mockConfigManager, 'configNames', 'get')
                .mockReturnValue([]);
            const logSpy = jest.spyOn(console, 'log');

            await new Skem().listConfigs();

            expect(logSpy).toHaveBeenCalled();
            expect(logSpy.mock.calls[0][0].indexOf('There are no blueprints') > -1).toBeTruthy();
            logSpy.mockReset();
        });
        it('should log the one available config', async function () {
            jest.spyOn(mockConfigManager, 'configNames', 'get')
                .mockReturnValue(['config']);
            const logSpy = jest.spyOn(console, 'log');

            await new Skem().listConfigs();

            expect(logSpy).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith(colors.grey('Here is the available blueprint:'));
            expect(logSpy).toHaveBeenCalledWith('-', 'config');
            logSpy.mockReset();
        });
        it('should log all the available configs', async function () {
            jest.spyOn(mockConfigManager, 'configNames', 'get')
                .mockReturnValue(['config1', 'config2']);
            const logSpy = jest.spyOn(console, 'log');

            await new Skem().listConfigs();

            expect(logSpy).toHaveBeenCalled();
            expect(logSpy).toHaveBeenCalledWith(colors.grey('Here are the available blueprints:'));
            expect(logSpy).toHaveBeenCalledWith('-', 'config1');
            expect(logSpy).toHaveBeenCalledWith('-', 'config2');
            logSpy.mockReset();
        });
    });
    describe('removeFromConfig', function () {
        it('should call removeFromConfig', async function () {
            const removeFromConfigSpy = jest.spyOn(mockConfigManager, 'removeFromConfig');

            await new Skem().removeFromConfig({ name: 'config', force: false });

            expect(removeFromConfigSpy).toHaveBeenCalledWith({ name: 'config', force: false });
        });
    });
    describe('printConfig', function () {
        it('should call printConfig', async function () {
            const printConfigSpy = jest.spyOn(mockConfigManager, 'printConfig');

            await new Skem().printConfig({ name: 'config' });

            expect(printConfigSpy).toHaveBeenCalledWith({ name: 'config' });
        });
    });
    describe('addFromGit', function () {
        it('should call git clone and extractConfigFromProject', async function () {
            const skem = new Skem();
            const createFolderIfNotExistsSyncSpy = jest.spyOn(FileManager, 'createFolderIfNotExistsSync')
                .mockImplementationOnce(jest.fn());
            const execSyncSpy = jest.spyOn(mockChildProcess, 'execSync')
                .mockImplementationOnce(jest.fn());
            const extractConfigFromProjectSpy = jest.spyOn(skem, 'extractConfigFromProject')
                .mockImplementationOnce(jest.fn());

            await skem.addFromGit({ git: 'https://git.com' });

            expect(createFolderIfNotExistsSyncSpy).toHaveBeenCalledWith('./git-repos');
            expect(execSyncSpy).toHaveBeenCalledWith(
                'git clone https://git.com ./git-repos/uuid',
                { stdio: [0, 1, 2] }
            );
            expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                git: 'https://git.com',
                path: './git-repos/uuid',
                name: '',
            });
        });
    });
});
