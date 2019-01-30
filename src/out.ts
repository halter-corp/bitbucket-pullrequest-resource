import { Logger } from './logger';
import { ConcourseRequest, SourceConfig, Version, Params, PullRequestInfo, ConcourseResponse, ConcourseFileSystem } from './concourse';
import { BitBucketClient, PullRequestState, PullRequest } from './bitbucket';
import { Execute, ExecuteResult } from './exec';

export class OutCommand {
    private _logger: Logger;
    private _bitBucketClient: BitBucketClient;
    private _fs: ConcourseFileSystem;

    constructor(logger: Logger, bitBucketClient: BitBucketClient, fs: ConcourseFileSystem) {
        this._bitBucketClient = bitBucketClient;
        this._logger = logger;
        this._fs = fs;
    }

    async doIt(source: SourceConfig, destination: string, params: Params): Promise<ConcourseResponse> {
        this._logger.debug('OutCommand.doIt()');
        const buildUrl = `${process.env.ATC_EXTERNAL_URL}/builds/${process.env.BUILD_ID}`;

        const baseUrl = process.env.ATC_EXTERNAL_URL;
        const team = process.env.BUILD_TEAM_NAME;
        const pipeline = process.env.BUILD_PIPELINE_NAME;
        const job = process.env.BUILD_JOB_NAME;
        const build = process.env.BUILD_NAME;
        const jobUrl = `${baseUrl}/teams/${team}/pipelines/${pipeline}/jobs/${job}/builds/${build}`;

        const state: PullRequestState = {
            state: params.state,
            key: params.name,
            name: `${params.name}-${process.env.BUILD_ID}`,
            url: jobUrl,
            description: params.description,
        };

        // get pull request info
        const pullRequestInfo: PullRequestInfo = JSON.parse(this._fs.readFileSync(`${destination}/${params.path}/pull-request-info`).toString());

        await this._bitBucketClient.postBuildStatus(source.project, source.repository, pullRequestInfo.commit, state);

        const concourseResponse: ConcourseResponse = {
            version: pullRequestInfo.concourse.version,
            metadata: [
                { name: 'title', value: pullRequestInfo.title },
                { name: 'url', value: pullRequestInfo.url },
                { name: 'author', value: pullRequestInfo.author.fullname },
                { name: 'commit', value: pullRequestInfo.commit },
                { name: 'feature-branch', value: pullRequestInfo.feature_branch },
                { name: 'upstream-branch', value: pullRequestInfo.upstream_branch },
                { name: 'pullrequest updated', value: pullRequestInfo.updated_at },
            ],
        };

        return concourseResponse;
    }
}
