import { Execute } from './exec';

describe('exec', () => {

    beforeAll(async () => {
    });

    beforeEach(() => {
    });

    it('runs ls', async () => {
        const execute = new Execute();

        const result = await execute.e('ls', ['-a', '/'], null);

        expect(result.code).toEqual(0);
        expect(result.stdout).toEqual(expect.stringContaining('etc'));
        expect(result.stdout).toEqual(expect.stringContaining('home'));
        expect(result.stderr.length).toEqual(0);
    });

    it('runs grep with stdin', async () => {
        const execute = new Execute();

        const result = await execute.e('grep', ['[a-b]'], 'a\nb\nc');

        expect(result.code).toEqual(0);
        expect(result.stdout).toEqual('a\nb\n');
        expect(result.stderr.length).toEqual(0);
    });

    it('return exit code', async () => {
        const execute = new Execute();

        const result = await execute.e('bash', ['-c', 'exit 23'], null);

        expect(result.code).toEqual(23);
    });
});
