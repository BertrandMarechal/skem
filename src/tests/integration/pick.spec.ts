import { runSkem } from '../helpers';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { FileManager } from '../../file-manager';

describe('pick', function () {
    describe('no config', () => {
        it('should add only the files that are picked ', () => {
            const blueprintName = v4();
            const installationFolderName = v4();
            runSkem(
                'add',
                path.resolve('./test-schematics/no-config/multiple-files'),
                [
                    ['-n', blueprintName],
                ]
            );
            runSkem(
                'install',
                path.resolve('./temp'),
                [
                    ['-n', blueprintName],
                    ['-p', installationFolderName],
                    ['--pick', 'index'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/index.ts`))).toEqual(true);
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/app.ts`))).toEqual(false);

            runSkem(
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
