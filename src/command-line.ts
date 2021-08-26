import commandLineUsage, { Section } from 'command-line-usage';
import { SkemOptions } from './index';

export type Commands =
    | 'help' | 'h'
    | 'install' | 'i'
    | 'add' | 'a'
    | 'generate' | 'g'
    | 'list' | 'ls'
    | 'remove' | 'rm'
    | 'update' | 'u'
    | 'print' | 'p';

const help: Record<string, Section[]> = {
    global: [
        {
            header: 'Skem',
            content: 'Your blueprint manager to ease boilerplate work.\nPlease try "skem <command> --help" to get help on the command.'
        },
        {
            header: 'Commands',
            content: [
                {
                    name: 'help',
                    typeLabel: 'h',
                    description: 'Shows the help.'
                },
                {
                    name: 'add',
                    typeLabel: 'a',
                    description: 'Reads the file or folder and saves the blueprint.'
                },
                {
                    name: 'install',
                    typeLabel: 'i',
                    description: 'Applies the blueprint in the selected location.'
                },
                {
                    name: 'list',
                    typeLabel: 'ls',
                    description: 'Lists the available blueprints.'
                },
                {
                    name: 'update',
                    typeLabel: 'u',
                    description: 'Updates the configurations.'
                },
                {
                    name: 'print',
                    typeLabel: 'p',
                    description: 'Prints the selected configuration.'
                },
                {
                    name: 'remove',
                    typeLabel: 'rm',
                    description: 'Remove blueprint from the available ones.'
                },
                {
                    name: 'generate',
                    typeLabel: 'g',
                    description: 'Alias for install.'
                },
            ]
        }
    ],
    add: [
        {
            header: 'add (a)',
            content: 'Reads the folder or file and saves your blueprint in Skem\'s list of blueprints.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Desired name for the blueprint.'
                },
                {
                    name: 'path',
                    alias: 'p',
                    description: 'Path of the file or folder to analyze.',
                    defaultValue: '.'
                },
                {
                    name: 'repo',
                    alias: 'r',
                    description: 'Considers the folder as a repository for skem blueprints, and loops through he sub folders.'
                },
            ]
        }
    ],
    install: [
        {
            header: 'install (i) / generate (g)',
            content: 'Applies the blueprint to the selected location.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Name of the blueprint.'
                },
                {
                    name: 'path',
                    alias: 'p',
                    description: 'Path of the file or folder to install in.',
                    defaultValue: '.'
                },
            ]
        }
    ],
    remove: [
        {
            header: 'remove (rm)',
            content: 'Removes the blueprint(s) from the skem list of blueprints.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Name of the blueprint. Offers to remove all if none passed'
                },
            ]
        }
    ],
    list: [
        {
            header: 'list (ls)',
            content: 'List the blueprint(s).'
        },
    ],
    print: [
        {
            header: 'print (p)',
            content: 'Prints information on the selected blueprint.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Name of the blueprint.'
                },
            ]
        }
    ],
    update: [
        {
            header: 'update (u)',
            content: 'Reads from the location the blueprint(s) was/were added from, and overwrites the current blueprint(s) with the latest information.'
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'name',
                    alias: 'n',
                    description: 'Name of the blueprint. Updates all if none passed.'
                },
            ]
        }
    ],
};

export class CommandLineUsage {
    static showHelp({ command }: SkemOptions): void {
        switch (command) {
        case 'help':
        case 'h':
            console.log(commandLineUsage(help.global));
            break;
        case 'add':
        case 'a':
            console.log(commandLineUsage(help.add));
            break;
        case 'remove':
        case 'rm':
            console.log(commandLineUsage(help.remove));
            break;
        case 'list':
        case 'ls':
            console.log(commandLineUsage(help.list));
            break;
        case 'print':
        case 'p':
            console.log(commandLineUsage(help.print));
            break;
        case 'update':
        case 'u':
            console.log(commandLineUsage(help.update));
            break;
        case 'install':
        case 'i':
        case 'generate':
        case 'g':
            console.log(commandLineUsage(help.install));
            break;
        }
    }
}
