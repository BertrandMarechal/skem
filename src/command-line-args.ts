import commandLineArgs from 'command-line-args';
import {Commands} from './command-line';

export interface SkemOptions {
    command: Commands;
    'install-packages': boolean;
    help: boolean;
    repo: boolean;
    all: boolean;
    name: string;
    ignore: string;
    path: string;
}

export class CommandLineArgs {
    static get options(): SkemOptions {
        return commandLineArgs([
            {
                name: 'command',
                type: String,
                multiple: false,
                defaultOption: true,
                defaultValue: 'help'
            },
            {
                name: 'install-packages',
                type: Boolean,
                defaultValue: false
            },
            {
                name: 'ignore',
                alias: 'i',
                type: String,
                defaultValue: ''
            },
            {
                name: 'repo',
                alias: 'r',
                type: Boolean,
                defaultValue: false
            },
            {
                name: 'help',
                alias: 'h',
                type: Boolean,
                defaultValue: false
            },
            {
                name: 'all',
                alias: 'a',
                type: Boolean,
                defaultValue: false
            },
            {
                name: 'name',
                alias: 'n',
                type: String
            },
            {
                name: 'path',
                alias: 'p',
                type: String,
                defaultValue: '.'
            },
        ]) as SkemOptions;
    }
}
