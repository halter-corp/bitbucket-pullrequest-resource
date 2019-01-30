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
