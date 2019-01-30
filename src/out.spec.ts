import { Logger } from './logger';
import { OutCommand } from './out';
import { BitBucketClient, PullRequest, PullRequestResponse } from './bitbucket';
import { ConcourseResponse, ConcourseRequest, ConcourseFileSystem, PullRequestInfo } from './concourse';
import { Execute } from './exec';

describe('out_command', () => {
    const logger: Logger = new Logger();
    let fs: ConcourseFileSystem;
    let bitBucketClient: BitBucketClient;
    let bitBucketClientSpyPostBuildStatus;

    let fsSpyReadFileSync;

    beforeAll(async () => {
        fs = {
            readFileSync: jest.fn().mockReturnValue('{}'),
            writeFileSync: jest.fn(),
            appendFileSync: jest.fn(),
            existsSync: jest.fn().mockReturnValue(true),
        };

        bitBucketClient = new BitBucketClient(logger, 'a', 'b', fs);
        bitBucketClientSpyPostBuildStatus = jest.spyOn(bitBucketClient, 'postBuildStatus');

        fsSpyReadFileSync = jest.spyOn(fs, 'readFileSync');
    });

    beforeEach(() => {
        bitBucketClientSpyPostBuildStatus.mockClear();
        fsSpyReadFileSync.mockClear();
    });

    it('returns a concourse response', async () => {
        const pullRequestInfo: PullRequestInfo = {
            id: '1',
            title: 'pr1',
            description: 'description',
            author: {
                name: 'Kurt',
                fullname: 'Kurt',
            },
            commit: '5dfb7f4fb',
            feature_branch: 'CORE-66',
            upstream_branch: 'master',
            url: 'https://bitbucket.org/halternz/bitbucket-pullrequest-resource/pull-requests/1',
            updated_at: '2018-11-19T22:23:49.457621+00:00',
            concourse: {
                version: {
                    id: '1',
                    commit: '5dfb7f4fb',
                    branch: 'CORE-66',
                    date: '2018-11-19T22:23:50.457621+00:00',
                },
            },
        };

        fsSpyReadFileSync.mockImplementation((path) => {
            if (path === '/tmp/bitbucket-test/pull-request/pull-request-info') {
                return Buffer.from(JSON.stringify(pullRequestInfo));
            } else if (path === '/tmp/bitbucketclient.json') {
                return '{}';
            }
            return '{}';
        });

        bitBucketClientSpyPostBuildStatus.mockReturnValue();

        const concourseRequest: ConcourseRequest = {
            source: {
                username: 'a',
                password: 'b',
                project: 'p',
                repository: 'r',
                limit: 1,
                git: {
                    uri: 'git@bitbucket.org:halternz/bitbucket-pullrequest-resource.git',
                    private_key: 'abcd',
                },
            },
            params: {
                name: 'concourse ci',
                path: 'pull-request',
                state: 'INPROGRESS',
            },
        };

        const outCommand: OutCommand = new OutCommand(logger, bitBucketClient, fs);
        const actual = await outCommand.doIt(concourseRequest.source, '/tmp/bitbucket-test', concourseRequest.params!);

        const expected: ConcourseResponse = {
            version: {
                id: '1',
                branch: 'CORE-66',
                commit: '5dfb7f4fb',
                date: '2018-11-19T22:23:50.457621+00:00',
            },
            metadata: [
                { name: 'title', value: 'pr1' },
                { name: 'url', value: 'https://bitbucket.org/halternz/bitbucket-pullrequest-resource/pull-requests/1' },
                { name: 'author', value: 'Kurt' },
                { name: 'commit', value: '5dfb7f4fb' },
                { name: 'feature-branch', value: 'CORE-66' },
                { name: 'upstream-branch', value: 'master' },
                { name: 'pullrequest updated', value: '2018-11-19T22:23:49.457621+00:00' },
            ],
        };

        expect(actual).toEqual(expected);
    });

});
