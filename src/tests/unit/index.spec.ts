import { jest } from '@jest/globals';
import { CommandLineArgs, SkemOptions } from '../../command-line-args';
import { CommandLineUsage } from '../../command-line';

const mockSkem = {
    install: jest.fn(),
    loopOnSubFoldersAndExtractConfigFromProject: jest.fn(),
    extractConfigFromProject: jest.fn(),
    removeFromConfig: jest.fn(),
    listConfigs: jest.fn(),
    printConfig: jest.fn(),
    update: jest.fn(),
};

jest.mock('../../skem', () => ({ Skem: jest.fn(() => mockSkem) }));

import { main } from '../../index';

const options: SkemOptions = {
    command: 'help',
    help: false,
    repo: false,
    all: false,
    force: false,
    name: '',
    ignore: '',
    path: '',
    variable: [],
};
describe('index', () => {
    describe('main', () => {
        afterEach(() => {
            jest.clearAllMocks();
        });
        describe('help', () => {
            it('should call showHelp if command is help', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'help'
                    }));
                const showHelpSpy = jest.spyOn(CommandLineUsage, 'showHelp');

                main();

                expect(showHelpSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'help'
                });
            });
            it('should call showHelp if command is h', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'h'
                    }));
                const showHelpSpy = jest.spyOn(CommandLineUsage, 'showHelp');

                main();

                expect(showHelpSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'h'
                });
            });
        });
        describe('options.help', () => {
            it('should call showHelp if options.help is true', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        help: true,
                        command: 'update'
                    }));
                const showHelpSpy = jest.spyOn(CommandLineUsage, 'showHelp');

                main();

                expect(showHelpSpy).toHaveBeenCalledWith({
                    ...options,
                    help: true,
                    command: 'update'
                });
            });
        });
        describe('install', () => {
            it('should call skem.install if command is install', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'install'
                    }));
                const installSpy = jest.spyOn(mockSkem, 'install');

                main();

                expect(installSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'install'
                });
            });
            it('should call skem.install if command is i', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'i'
                    }));
                const installSpy = jest.spyOn(mockSkem, 'install');

                main();

                expect(installSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'i'
                });
            });
        });
        describe('add', () => {
            describe('not repo', () => {
                it('should call skem.extractConfigFromProject if command is add', () => {
                    jest.spyOn(CommandLineArgs, 'options', 'get')
                        .mockImplementationOnce(() => ({
                            ...options,
                            command: 'add'
                        }));
                    const extractConfigFromProjectSpy = jest.spyOn(mockSkem, 'extractConfigFromProject');

                    main();

                    expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                        ...options,
                        command: 'add'
                    });
                });
                it('should call skem.extractConfigFromProject if command is a', () => {
                    jest.spyOn(CommandLineArgs, 'options', 'get')
                        .mockImplementationOnce(() => ({
                            ...options,
                            command: 'a'
                        }));
                    const extractConfigFromProjectSpy = jest.spyOn(mockSkem, 'extractConfigFromProject');

                    main();

                    expect(extractConfigFromProjectSpy).toHaveBeenCalledWith({
                        ...options,
                        command: 'a'
                    });
                });
            });
            describe('repo', () => {
                it('should call skem.loopOnSubFoldersAndExtractConfigFromProject if command is add', () => {
                    jest.spyOn(CommandLineArgs, 'options', 'get')
                        .mockImplementationOnce(() => ({
                            ...options,
                            command: 'add',
                            repo: true,
                        }));
                    const loopOnSubFoldersAndExtractConfigFromProjectSpy = jest.spyOn(mockSkem, 'loopOnSubFoldersAndExtractConfigFromProject');

                    main();

                    expect(loopOnSubFoldersAndExtractConfigFromProjectSpy).toHaveBeenCalledWith({
                        ...options,
                        command: 'add',
                        repo: true,
                    });
                });
                it('should call skem.loopOnSubFoldersAndExtractConfigFromProject if command is a', () => {
                    jest.spyOn(CommandLineArgs, 'options', 'get')
                        .mockImplementationOnce(() => ({
                            ...options,
                            command: 'a',
                            repo: true,
                        }));
                    const loopOnSubFoldersAndExtractConfigFromProjectSpy = jest.spyOn(mockSkem, 'loopOnSubFoldersAndExtractConfigFromProject');

                    main();

                    expect(loopOnSubFoldersAndExtractConfigFromProjectSpy).toHaveBeenCalledWith({
                        ...options,
                        command: 'a',
                        repo: true,
                    });
                });
            });
        });
        describe('remove', () => {
            it('should call skem.removeFromConfig if command is remove', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'remove'
                    }));
                const removeFromConfigSpy = jest.spyOn(mockSkem, 'removeFromConfig');

                main();

                expect(removeFromConfigSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'remove'
                });
            });
            it('should call skem.removeFromConfig if command is rm', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'rm'
                    }));
                const removeFromConfigSpy = jest.spyOn(mockSkem, 'removeFromConfig');

                main();

                expect(removeFromConfigSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'rm'
                });
            });
        });
        describe('remove', () => {
            it('should call skem.listConfigs if command is list', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'list'
                    }));
                const listConfigsSpy = jest.spyOn(mockSkem, 'listConfigs');

                main();

                expect(listConfigsSpy).toHaveBeenCalledWith();
            });
            it('should call skem.listConfigs if command is ls', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'ls'
                    }));
                const listConfigsSpy = jest.spyOn(mockSkem, 'listConfigs');

                main();

                expect(listConfigsSpy).toHaveBeenCalledWith();
            });
        });
        describe('print', () => {
            it('should call skem.printConfig if command is print', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'print'
                    }));
                const printConfigSpy = jest.spyOn(mockSkem, 'printConfig');

                main();

                expect(printConfigSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'print'
                });
            });
            it('should call skem.printConfig if command is p', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'p'
                    }));
                const printConfigSpy = jest.spyOn(mockSkem, 'printConfig');

                main();

                expect(printConfigSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'p'
                });
            });
        });
        describe('update', () => {
            it('should call skem.update if command is update', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'update'
                    }));
                const updateSpy = jest.spyOn(mockSkem, 'update');

                main();

                expect(updateSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'update'
                });
            });
            it('should call skem.update if command is u', () => {
                jest.spyOn(CommandLineArgs, 'options', 'get')
                    .mockImplementationOnce(() => ({
                        ...options,
                        command: 'u'
                    }));
                const updateSpy = jest.spyOn(mockSkem, 'update');

                main();

                expect(updateSpy).toHaveBeenCalledWith({
                    ...options,
                    command: 'u'
                });
            });
        });
    });
});
