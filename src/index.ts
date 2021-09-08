#!/usr/bin/env node
import { CommandLineUsage } from './command-line';
import { CommandLineArgs, SkemOptions } from './command-line-args';
import { Skem } from './skem';

const skem = new Skem();

export async function main(): Promise<void> {
    const options: SkemOptions = CommandLineArgs.options;
    if (options.help) {
        CommandLineUsage.showHelp(options);
    } else {
        console.log();
        switch (options.command) {
        case 'help':
        case 'h':
            CommandLineUsage.showHelp(options);
            break;
        case 'install':
        case 'i':
            await skem.install(options);
            break;
        case 'add':
        case 'a':
            if (options.repo) {
                await skem.loopOnSubFoldersAndExtractConfigFromProject(options);
            } else {
                await skem.extractConfigFromProject(options);
            }
            break;
        case 'remove':
        case 'rm':
            await skem.removeFromConfig(options);
            break;
        case 'list':
        case 'ls':
            await skem.listConfigs();
            break;
        case 'print':
        case 'p':
            await skem.printConfig(options);
            break;
        case 'update':
        case 'u':
            await skem.update(options);
            break;
        }
    }
    console.log();
}

(async () => {
    await main();
})();

