import { runSkem } from '../helpers';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { FileManager } from '../../file-manager';

describe('simple-file', function () {
    describe('no config', () => {
        it('should add and install properly ', async () => {
            const blueprintName = v4();
            const installationFolderName = v4();
            const name = v4();
            await runSkem(
                'add',
                path.resolve('./test-schematics/no-config/single-files'),
                [
                    ['-n', blueprintName],
                    ['-p', 'test____name____file.ts'],
                ]
            );
            await runSkem(
                'install',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                    ['-p', installationFolderName],
                    ['-v', `name=${name}`],
                    ['-v', 'console=log'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/test_${name}_file.ts`))).toEqual(true);
            const fileContent = fs.readFileSync(path.resolve(`./temp/${installationFolderName}/test_${name}_file.ts`), 'ascii');
            expect(fileContent.indexOf('console.log(\'log\');')).toEqual(0);

            await runSkem(
                'remove',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                ]
            );
            fs.rmdirSync(path.resolve(`./temp/${installationFolderName}`), { recursive: true });
        });
    });
    describe('with config', () => {
        it('should add and install properly ', async () => {
            const blueprintName = v4();
            const installationFolderName = v4();
            const name = v4();
            await runSkem(
                'add',
                path.resolve('./test-schematics/config/single-files'),
                [
                    ['-n', blueprintName],
                ]
            );
            await runSkem(
                'install',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                    ['-p', installationFolderName],
                    ['-v', `name=${name}`],
                    ['-v', 'console=log'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/test_${name}_file.ts`))).toEqual(true);
            const fileContent = fs.readFileSync(path.resolve(`./temp/${installationFolderName}/test_${name}_file.ts`), 'ascii');
            expect(fileContent.indexOf('console.log(\'log\');')).toEqual(0);

            await runSkem(
                'remove',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                ]
            );
            fs.rmdirSync(path.resolve(`./temp/${installationFolderName}`), { recursive: true });
        });
    });
});
