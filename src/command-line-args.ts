import commandLineArgs from 'command-line-args';
import {SkemCommands} from './command-line';

export interface SkemOptions {
    command: SkemCommands;
    help: boolean;
    repo: boolean;
    all: boolean;
    name: string;
    ignore: string;
    path: string;
    variable: string[];
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
            {
                name: 'variable',
                alias: 'v',
                type: String,
                lazyMultiple: true
            },
        ]) as SkemOptions;
    }
}
