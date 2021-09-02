import { runSkem } from '../helpers';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { FileManager } from '../../file-manager';

describe('hooks', function () {
    describe('with config', () => {
        it('should have the node modules after installation ', () => {
            const blueprintName = v4();
            const installationFolderName = v4();
            const name = v4();
            runSkem(
                'add',
                path.resolve('./test-schematics/config/with-npm-install'),
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
                    ['-v', `name=${name}`],
                    ['-v', 'console=log'],
                ]
            );
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/package.json`))).toEqual(true);
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/node_modules`))).toEqual(true);

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
