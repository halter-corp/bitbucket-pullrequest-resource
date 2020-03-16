import { execFile } from 'child_process';
import * as streams from 'memory-streams';

export interface ExecuteResult {
    code: number;
    stdout: string;
    stderr: string;
}

export class Execute {
    constructor() {}

    async e(path: string, args: string[], stdin: string | null): Promise<ExecuteResult> {
        const stdoutWriter = new streams.WritableStream();
        const stderrWriter = new streams.WritableStream();

        const child = execFile(path, args);

        if (child == null) {
          throw new Error(`could not get child process from path ${path}, and args ${args}`);
        }

        if (child.stdout == null) {
          throw new Error(`chilld.stdout is null`);
        }

        if (child.stderr == null) {
          throw new Error(`chilld.stderr is null`);
        }

        if (child.stdin == null) {
          throw new Error(`chilld.stdin is null`);
        }

        child.stdout.pipe(stdoutWriter);
        child.stderr.pipe(stderrWriter);

        if (stdin != null) {
            child.stdin.write(stdin);
            child.stdin.end();
        }

        const code = await new Promise<number>((resolve, reject) => {
            child.on('close', resolve);
        });

        return {
            code,
            stdout: stdoutWriter.toString(),
            stderr: stderrWriter.toString(),
        };
    }
}
