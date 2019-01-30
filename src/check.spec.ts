import { SourceConfig, Version } from './concourse';
import { Logger } from './logger';
import { CheckCommand } from './check';
import { BitBucketClient, PullRequest } from './bitbucket';
import * as fs from 'fs';

describe('check_command', () => {
    let bitBucketClient: BitBucketClient;
    let bitBucketClientSpyGetPullRequests;
    const logger: Logger = new Logger();

    beforeAll(async () => {
        bitBucketClient = new BitBucketClient(logger, 'a', 'b', fs);
        bitBucketClientSpyGetPullRequests = jest.spyOn(bitBucketClient, 'getPullRequests');
    });

    beforeEach(() => {
        bitBucketClientSpyGetPullRequests.mockClear();
    });

    it('returns an array with pull requests including existing version', async () => {
        const mockNewestPullRequest: PullRequest = {
            id: '1',
            branch: 'CORE-123',
            commit: 'abcdef',
            date: '123',
        };
        bitBucketClientSpyGetPullRequests.mockReturnValue([mockNewestPullRequest]);

        const source: SourceConfig = {
            username: 'a',
            password: 'b',
            project: 'p',
            repository: 'r',
            limit: 1,
            git: {
                uri: 'git@bitbucket.org:halternz/bitbucket-pullrequest-resource.git',
                private_key: 'abcd',
            },
        };

        const version: Version = {
            commit: 'abcde',
            id: '1',
            branch: 'feature/a',
            date: '345',
        };

        const checkCommand: CheckCommand = new CheckCommand(logger, bitBucketClient);

        const actual = await checkCommand.doIt(source, version);

        expect(actual).toEqual([mockNewestPullRequest, version]);
    });

    it('returns empty list when there are no pull requests an no existing versions', async () => {
        bitBucketClientSpyGetPullRequests.mockReturnValue([]);
        const checkCommand: CheckCommand = new CheckCommand(logger, bitBucketClient);

        const source: SourceConfig = {
            username: 'a',
            password: 'b',
            project: 'p',
            repository: 'r',
            limit: 1,
            git: {
                uri: 'git@bitbucket.org:halternz/bitbucket-pullrequest-resource.git',
                private_key: 'abcd',
            },
        };
        const actual = await checkCommand.doIt(source, undefined);

        expect(actual).toEqual([]);
    });

    it('returns only existing version if no pull requests', async () => {
        bitBucketClientSpyGetPullRequests.mockReturnValue([]);
        const checkCommand: CheckCommand = new CheckCommand(logger, bitBucketClient);

        const source: SourceConfig = {
            username: 'a',
            password: 'b',
            project: 'p',
            repository: 'r',
            limit: 1,
            git: {
                uri: 'git@bitbucket.org:halternz/bitbucket-pullrequest-resource.git',
                private_key: 'abcd',
            },
        };
        const version: Version = {
            commit: 'abcde',
            id: '1',
            branch: 'feature/a',
            date: '345',
        };
        const actual = await checkCommand.doIt(source, version);

        expect(actual).toEqual([version]);
    });
});
