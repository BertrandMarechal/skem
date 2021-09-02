import { jest } from '@jest/globals';
import commandLineUsage from 'command-line-usage';
import { CommandLineUsage, help } from '../../command-line';

describe('command-line', function () {
    describe('showHelp', function () {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        describe('help', () => {
            it('should call with global for help', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'help' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.global));
            });
            it('should call with global for h', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'h' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.global));
            });
        });
        describe('add', () => {
            it('should call with add for add', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'add' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.add));
            });
            it('should call with add for a', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'a' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.add));
            });
        });
        describe('remove', () => {
            it('should call with remove for remove', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'remove' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.remove));
            });
            it('should call with remove for rm', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'rm' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.remove));
            });
        });
        describe('list', () => {
            it('should call with list for list', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'list' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.list));
            });
            it('should call with list for ls', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'ls' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.list));
            });
        });
        describe('print', () => {
            it('should call with print for print', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'print' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.print));
            });
            it('should call with print for p', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'p' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.print));
            });
        });
        describe('update', () => {
            it('should call with update for update', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'update' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.update));
            });
            it('should call with update for u', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'u' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.update));
            });
        });
        describe('install', () => {
            it('should call with install for install', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'install' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.install));
            });
            it('should call with install for i', () => {
                const logSpy = jest.spyOn(console, 'log');
                CommandLineUsage.showHelp({ command: 'i' });
                expect(logSpy).toHaveBeenCalledWith(commandLineUsage(help.install));
            });
        });
    });
});
