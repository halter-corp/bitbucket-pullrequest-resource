import { Logger } from './logger';
import { InCommand } from './in';
import { BitBucketClient, PullRequest, PullRequestResponse } from './bitbucket';
import { ConcourseResponse, ConcourseRequest } from './concourse';
import { Execute } from './exec';
import * as fs from 'fs';

describe('in_command', () => {
    let bitBucketClient: BitBucketClient;
    let bitBucketClientSpyGetPullRequest;
    let execute: Execute;
    let executeSpyE;
    let fsSpyAppendFileSync;
    let fsSpyWriteFileSync;
    const logger: Logger = new Logger();

    beforeAll(async () => {
        bitBucketClient = new BitBucketClient(logger, 'a', 'b', fs);
        bitBucketClientSpyGetPullRequest = jest.spyOn(bitBucketClient, 'getPullRequest');
        execute = new Execute();
        executeSpyE = jest.spyOn(execute, 'e');

        fsSpyAppendFileSync = jest.spyOn(fs, 'appendFileSync');
        fsSpyWriteFileSync = jest.spyOn(fs, 'writeFileSync');
    });

    beforeEach(() => {
        bitBucketClientSpyGetPullRequest.mockClear();
        executeSpyE.mockClear();
        fsSpyAppendFileSync.mockClear();
        fsSpyWriteFileSync.mockClear();
    });

    it('returns a concourse response', async () => {
        const mockPullRequestResponse: PullRequestResponse = {
            id: '1',
            title: 'title',
            description: 'bla',
            links: {
                html: {
                    href: 'https://example.com',
                },
            },
            author: {
                username: 'kurtmc',
                display_name: 'Kurt',
            },
            destination: {
                branch: {
                    name: 'feature/a',
                },
            },
            updated_on: '2018-11-18T20:34:52+00:00',
            created_on: '2018-11-18T20:34:52+00:00',
        };
        bitBucketClientSpyGetPullRequest.mockReturnValue(mockPullRequestResponse);
        executeSpyE.mockReturnValue({code: 0, stdout: '', stderr: ''});
        fsSpyAppendFileSync.mockReturnValue();
        fsSpyWriteFileSync.mockReturnValue();

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
            version: {
                id: '1',
                branch: 'feature/a',
                commit: '0318cb',
                date: '2018-11-18T20:34:52+00:00',
            },
        };

        const inCommand: InCommand = new InCommand(logger, bitBucketClient, fs, execute);
        const actual = await inCommand.doIt(concourseRequest.source, '/tmp/bitbucket-test', concourseRequest.version!);

        const expected: ConcourseResponse = {
            version: {
                id: '1',
                branch: 'feature/a',
                commit: '0318cb',
                date: '2018-11-18T20:34:52+00:00',
            },
            metadata: [
                { name: 'title', value: 'title' },
                { name: 'url', value: 'https://example.com' },
                { name: 'author', value: 'Kurt' },
                { name: 'commit', value: '0318cb' },
                { name: 'feature-branch', value: 'feature/a' },
                { name: 'upstream-branch', value: 'feature/a' },
                { name: 'pullrequest updated', value: '2018-11-18T20:34:52+00:00' },
            ],
        };

        expect(actual).toEqual(expected);
    });

});
