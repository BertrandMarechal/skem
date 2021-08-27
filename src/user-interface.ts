import inquirer from 'inquirer';
import colors from 'colors';

export class UserInterface {
    static async selectBlueprint(configNames: string[]): Promise<string> {
        let configName = '';
        while (!configName) {
            const { choice } = await inquirer.prompt({
                name: 'choice',
                type: 'list',
                message: 'Please choose the blueprint you want:',
                choices: configNames
            });
            configName = choice;
        }
        return configName;
    }

    static async removeAllConfigurations(): Promise<boolean> {
        const { all } = await inquirer.prompt({
            type: 'confirm',
            name: 'all',
            message: 'Do you want to remove all configurations ?'
        });
        return all;
    }

    static async chooseValidNameForBlueprint(): Promise<string> {
        let configName = '';
        while (!configName) {
            const { desiredName } = await inquirer.prompt({
                name: 'desiredName',
                type: 'input',
                message: 'Please choose a name for this blueprint:'
            });
            configName = desiredName;
        }
        return configName;
    }

    static async chooseValidNameForBlueprintImplementation(): Promise<string> {
        let configName = '';
        while (!configName) {
            const { desiredName } = await inquirer.prompt({
                name: 'desiredName',
                type: 'input',
                message: 'Please choose a name to apply blueprint:'
            });
            configName = desiredName;
        }
        return configName;
    }

    static async chooseValidVariable(variableName: string): Promise<string> {
        let variable = '';
        while (!variable) {
            const { response } = await inquirer.prompt({
                type: 'input',
                message: `Please provide a value for variable "${variableName}":`,
                name: 'response'
            });
            variable = response;
        }
        return variable;
    }

    static async overwriteFolderNameForBlueprint(configName: string): Promise<string> {
        const { desiredName } = await inquirer.prompt({
            name: 'desiredName',
            type: 'input',
            message: `Please choose a name for this blueprint (press enter for "${configName}")`
        });
        if (desiredName) {
            return desiredName;
        }
        return configName;
    }

    static async confirmOverwriteOfBlueprintOrExit(configName: string): Promise<void> {
        const { confirm } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirm',
            message: `There is an existing configuration with this name (${colors.yellow(configName)}). Do you want to overwrite it ?`
        });
        if (!confirm) {
            process.exit(0);
        }
    }
}
