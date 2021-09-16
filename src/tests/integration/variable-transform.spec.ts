import { ENTER, runSkem } from '../helpers';
import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { FileManager } from '../../file-manager';

describe('variableTransform', function () {
    describe('config', () => {
        it('should not ask for fileNameCamelCase and default defaultedVariable', async () => {
            const blueprintName = v4();
            const installationFolderName = v4();
            await runSkem(
                'add',
                path.resolve('./test-schematics/config/with-variable-transformer'),
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
                    ['-v', 'file-name=super-file'],
                ],
                [{ time: 10, command: ENTER }]
            );
            expect(FileManager.exists(path.resolve(`./temp/${installationFolderName}/super-file.ts`))).toEqual(true);
            const fileContent = fs.readFileSync(path.resolve(`./temp/${installationFolderName}/super-file.ts`), 'ascii');
            expect(fileContent.indexOf('console.log(\'superFile\');') > -1).toEqual(true);
            expect(fileContent.indexOf('console.log(\'aDefaultValue\');') > -1).toEqual(true);

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
