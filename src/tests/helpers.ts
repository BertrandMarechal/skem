import child_process from 'child_process';
import { SkemCommands } from '../command-line';
import path from 'path';

export const ENTER = '\x0D';

export async function runSkem(
    operation: SkemCommands,
    cwd: string,
    options: [string, string][] = [],
    commands: { time: number, command: string }[] = [],
): Promise<string> {
    console.log(`skem ${operation} ${options.map((nameAndValue) => nameAndValue.join(' ')).join(' ')} in ${cwd}`);
    const command = `node ${path.resolve('./dist/index')}`;
    try {
        return new Promise((resolve, reject) => {
            const { stdin } = child_process.exec(
                `${command} ${operation} ${options.map((nameAndValue) => nameAndValue.join(' ')).join(' ')}`,
                { cwd },
                (err, stdout) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(stdout);
                    }
                }
            );
            for (const { command, time } of commands) {
                setTimeout(() => {
                    if (stdin) {
                        stdin.cork();
                        stdin.write(command);
                        stdin.uncork();
                    }
                }, time);
            }
        });
    } catch (e) {
        console.log(e);
        throw e;
    }
}
