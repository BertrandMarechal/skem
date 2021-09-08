import { jest } from '@jest/globals';

jest.mock('inquirer');
import { UserInterface } from '../../user-interface';
import inquirer from 'inquirer';
import colors from 'colors';

describe('user-interface', function () {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('selectBlueprint', () => {
        it('should return the selected config', async () => {
            let first = true;
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    if (first) {
                        first = false;
                        return {
                            choice: ''
                        } as never;
                    }
                    return {
                        choice: 'config1'
                    } as never;
                });

            const response = await UserInterface.selectBlueprint(['config1', 'config2']);

            expect(response).toEqual('config1');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(2);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                name: 'choice',
                type: 'list',
                message: 'Please choose the blueprint you want:',
                choices: ['config1', 'config2']
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('removeAllConfigurations', () => {
        it('should return the selection from the user', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({
                    all: true
                } as never));

            const response = await UserInterface.removeAllConfigurations();

            expect(response).toEqual(true);
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'confirm',
                name: 'all',
                message: 'Do you want to remove all blueprints ?'
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('chooseValidNameForBlueprint', () => {
        it('should return the selected config', async () => {
            let first = true;
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    if (first) {
                        first = false;
                        return {
                            desiredName: ''
                        } as never;
                    }
                    return {
                        desiredName: 'config1'
                    } as never;
                });

            const response = await UserInterface.chooseValidNameForBlueprint();

            expect(response).toEqual('config1');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(2);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                name: 'desiredName',
                type: 'input',
                message: 'Please choose a name for this blueprint:'
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('chooseValidVariable', () => {
        it('should return the value the user entered value', async () => {
            let first = true;
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    if (first) {
                        first = false;
                        return {
                            response: ''
                        } as never;
                    }
                    return {
                        response: 'value'
                    } as never;
                });

            const response = await UserInterface.chooseValidVariable('var');

            expect(response).toEqual('value');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(2);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'input',
                message: 'Please provide a value for variable "var":',
                name: 'response'
            });

            inquirerPromptSpy.mockReset();
        });
        it('should return the value the user entered after being prompted there is a default one', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    return {
                        response: 'value'
                    } as never;
                });

            const response = await UserInterface.chooseValidVariable('var', 'currentValue');

            expect(response).toEqual('value');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'input',
                message: 'Please provide a value for variable "var" (current value: "currentValue". Press enter to carry on with it):',
                name: 'response'
            });

            inquirerPromptSpy.mockReset();
        });
        it('should return the default value if user did not enter one', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    return {
                        response: ''
                    } as never;
                });

            const response = await UserInterface.chooseValidVariable('var', 'currentValue');

            expect(response).toEqual('currentValue');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'input',
                message: 'Please provide a value for variable "var" (current value: "currentValue". Press enter to carry on with it):',
                name: 'response'
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('overwriteFolderNameForBlueprint', () => {
        it('should return the new name if one selected', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ desiredName: 'desiredName' } as never));

            const response = await UserInterface.overwriteFolderNameForBlueprint('originalName');

            expect(response).toEqual('desiredName');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                name: 'desiredName',
                type: 'input',
                message: 'Please choose a name for this blueprint (press enter for "originalName")'
            });

            inquirerPromptSpy.mockReset();
        });
        it('should return the old name if none are enterred', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ desiredName: '' } as never));

            const response = await UserInterface.overwriteFolderNameForBlueprint('originalName');

            expect(response).toEqual('originalName');
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                name: 'desiredName',
                type: 'input',
                message: 'Please choose a name for this blueprint (press enter for "originalName")'
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('confirmOverwriteOfBlueprintOrExit', () => {
        it('should carry on if we confirm', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ confirm: true } as never));
            const exitSpy = jest.spyOn(process, 'exit');

            await UserInterface.confirmOverwriteOfBlueprintOrExit('originalName');

            expect(exitSpy).not.toHaveBeenCalled();
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'confirm',
                name: 'confirm',
                message: `There is an existing configuration with this name (${colors.yellow('originalName')}). Do you want to overwrite it ?`
            });

            inquirerPromptSpy.mockReset();
        });
        it('should stop if we do not confirm', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ confirm: false } as never));
            const exitSpy = jest.spyOn(process, 'exit')
                .mockImplementationOnce(jest.fn());

            await UserInterface.confirmOverwriteOfBlueprintOrExit('originalName');

            expect(exitSpy).toHaveBeenCalledWith(0);
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'confirm',
                name: 'confirm',
                message: `There is an existing configuration with this name (${colors.yellow('originalName')}). Do you want to overwrite it ?`
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('confirmOverwriteOfFile', () => {
        it('should return what is told by the user', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ confirm: true } as never));

            const response = await UserInterface.confirmOverwriteOfFile('fileName');

            expect(response).toEqual(true);
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'confirm',
                name: 'confirm',
                message: `There is an existing file this name "${colors.yellow('fileName')}". Do you want to overwrite it ?`
            });

            inquirerPromptSpy.mockReset();
        });
    });
    describe('selectFilesToInstall', () => {
        it('should return what is told by the user', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ filesToInstall: ['f1', 'f2'] } as never));

            const response = await UserInterface.selectFilesToInstall(['f1', 'f2', 'f3']);

            expect(response).toEqual(['f1', 'f2']);
            expect(inquirerPromptSpy).toHaveBeenCalledTimes(1);
            expect(inquirerPromptSpy).toHaveBeenCalledWith({
                type: 'checkbox',
                name: 'filesToInstall',
                message: 'Please select the files you want to install',
                choices: ['f1', 'f2', 'f3']
            });

            inquirerPromptSpy.mockReset();
        });
    });
});
