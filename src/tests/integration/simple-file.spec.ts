import { runSkem } from '../helpers';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { FileManager } from '../../file-manager';

describe('simple-file', function () {
    describe('no config', () => {
        it('should add and install properly ', () => {
            const blueprintName = v4();
            const name = v4();
            runSkem(
                'add',
                path.resolve('./test-schematics/no-config/single-files'),
                [
                    ['-n', blueprintName],
                    ['-p', 'test____name____file.ts'],
                ]
            );
            runSkem(
                'install',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                    ['-v', `name=${name}`],
                    ['-v', 'console=log'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/test_${name}_file.ts`))).toEqual(true);
            const fileContent = fs.readFileSync(path.resolve(`./temp/test_${name}_file.ts`), 'ascii');
            expect(fileContent.indexOf('console.log(\'log\');')).toEqual(0);

            runSkem(
                'remove',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                ]
            );
            fs.unlinkSync(path.resolve(`./temp/test_${name}_file.ts`));
        });
    });
    describe('with config', () => {
        it('should add and install properly ', () => {
            const blueprintName = v4();
            const name = v4();
            runSkem(
                'add',
                path.resolve('./test-schematics/config/single-files'),
                [
                    ['-n', blueprintName],
                ]
            );
            runSkem(
                'install',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                    ['-v', `name=${name}`],
                    ['-v', 'console=log'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/test_${name}_file.ts`))).toEqual(true);
            const fileContent = fs.readFileSync(path.resolve(`./temp/test_${name}_file.ts`), 'ascii');
            expect(fileContent.indexOf('console.log(\'log\');')).toEqual(0);

            runSkem(
                'remove',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                ]
            );
            fs.unlinkSync(path.resolve(`./temp/test_${name}_file.ts`));
        });
    });
});
