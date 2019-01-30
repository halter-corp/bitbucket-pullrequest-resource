import { Logger } from './logger';
import { ConcourseRequest, SourceConfig, Version, ConcourseResponse, PullRequestInfo, ConcourseFileSystem } from './concourse';
import { BitBucketClient, PullRequest, PullRequestResponse } from './bitbucket';
import { execFile } from 'child_process';
import { Execute } from './exec';

interface GitResourcePayload {
    source: {
        uri: string;
        private_key: string;
        branch: string;
    };
    version: {
        ref: string;
    };
}

export class InCommand {
    private _logger: Logger;
    private _bitBucketClient: BitBucketClient;
    private _fs: ConcourseFileSystem;
    private _e: Execute;

    constructor(logger: Logger, bitBucketClient: BitBucketClient, fs: ConcourseFileSystem, e: Execute) {
        this._bitBucketClient = bitBucketClient;
        this._logger = logger;
        this._fs = fs;
        this._e = e;
    }

    async doIt(source: SourceConfig, destination: string, version: Version): Promise<ConcourseResponse> {
        this._logger.debug('InCommand.doIt(source, destination, version)');
        this._logger.debug(`InCommand.doIt() - source: ${JSON.stringify(source)}`);
        this._logger.debug(`InCommand.doIt() - destination: ${JSON.stringify(destination)}`);
        this._logger.debug(`InCommand.doIt() - version: ${JSON.stringify(version)}`);
        const pr: PullRequestResponse = await this._bitBucketClient.getPullRequest(
            source.project,
            source.repository,
            version.id,
        );

        const gitPayload: GitResourcePayload = {
            source: {
                uri: source.git.uri,
                branch: version.branch,
                private_key: source.git.private_key,
            },
            version: {
                ref: version.commit,
            },
        };

        const executeResult = await this._e.e('/opt/git-resource/in', [destination], JSON.stringify(gitPayload));

        if (executeResult.code !== 0) {
            throw new Error(`git resource exited with code: ${executeResult.code}`);
        }

        this._logger.debug(`in - git resource stderr: ${executeResult.stderr}`);
        this._logger.debug(`in - git resource stdout: ${executeResult.stdout}`);

        // write pull-request-info for use with out resource
        const pullRequestInfo: PullRequestInfo = {
            id: pr.id,
            description: pr.description,
            author: {
                name: pr.author.username,
                fullname: pr.author.display_name,
            },
            commit: version.commit,
            feature_branch: version.branch,
            title: pr.title,
            upstream_branch: pr.destination.branch.name,
            url: pr.links.html.href,
            updated_at: pr.created_on,
            concourse: {
                version,
            },
        };
        this._fs.appendFileSync(`${destination}/.git/info/exclude`, 'pull-request-info');
        this._fs.writeFileSync(`${destination}/pull-request-info`, JSON.stringify(pullRequestInfo));

        const concourseResponse: ConcourseResponse = {
            version,
            metadata: [
                { name: 'title', value: pr.title },
                { name: 'url', value: pr.links.html.href },
                { name: 'author', value: pr.author.display_name },
                { name: 'commit', value: version.commit },
                { name: 'feature-branch', value: version.branch },
                { name: 'upstream-branch', value: pr.destination.branch.name },
                { name: 'pullrequest updated', value: pr.updated_on },
            ],
        };
        return concourseResponse;
    }
}
