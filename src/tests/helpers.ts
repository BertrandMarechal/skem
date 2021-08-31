import child_process from 'child_process';
import { SkemCommands } from '../command-line';

export function runSkem(operation: SkemCommands, cwd: string, options: [string, string][] = []): void {
    console.log(`skem ${operation} ${options.map((nameAndValue) => nameAndValue.join(' ')).join(' ')}`);
    child_process.execSync(
        `skem ${operation} ${options.map((nameAndValue) => nameAndValue.join(' ')).join(' ')}`,
        {
            stdio: [0, 1, 2],
            cwd
        }
    );
}
