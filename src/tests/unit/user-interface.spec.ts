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
                        } as any;
                    }
                    return {
                        choice: 'config1'
                    } as any;
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
                } as any));

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
                        } as any;
                    }
                    return {
                        desiredName: 'config1'
                    } as any;
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
        it('should return the selected config', async () => {
            let first = true;
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => {
                    if (first) {
                        first = false;
                        return {
                            response: ''
                        } as any;
                    }
                    return {
                        response: 'value'
                    } as any;
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
    });
    describe('overwriteFolderNameForBlueprint', () => {
        it('should return the new name if one selected', async () => {
            const inquirerPromptSpy = jest.spyOn(inquirer, 'prompt')
                .mockImplementation(async () => ({ desiredName: 'desiredName' } as any));

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
                .mockImplementation(async () => ({ desiredName: '' } as any));

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
                .mockImplementation(async () => ({ confirm: true } as any));
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
                .mockImplementation(async () => ({ confirm: false } as any));
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
                .mockImplementation(async () => ({ confirm: true } as any));

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
});
