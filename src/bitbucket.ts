import { Logger } from './logger';
import { CacheRequester } from './cache-requester';
import { ConcourseFileSystem } from './concourse';

interface Commit {
    date: string;
}

export interface PullRequestState {
    state: string;
    key: string;
    name: string;
    description?: string;
    url: string;
}

export interface PullRequestResponse {
    id: string;
    description: string;
    author: {
        username: string;
        display_name: string;
    };
    title: string;
    links: {
        html: {
            href: string;
        };
    };
    destination: {
        branch: {
            name: string;
        };
    };
    created_on: string;
    updated_on: string;
}

interface PullRequestsResponse {
    values: [{
        id: string;
        source: {
            branch: {
                name: string;
            },
            commit: {
                hash: string;
                links: {
                    self: {
                        href: string;
                    },
                },
            },
        }
    }];
}

export interface PullRequest {
    id: string;
    branch: string;
    commit: string;
    date: string;
}

export class BitBucketClient {
    private _password: string;
    private _username: string;
    private _cacheRequester: CacheRequester;
    private _logger: Logger;

    constructor(logger: Logger, username: string, password: string, fs: ConcourseFileSystem) {
        this._logger = logger;
        this._username = username;
        this._password = password;
        this._cacheRequester = new CacheRequester(this._logger, '/tmp/bitbucketclient.json', this._username, this._password, fs);
    }

    async getPullRequestsResponse(project: string, repository: string, limit: number): Promise<PullRequestsResponse> {
        if (limit == null) {
            limit = 100;
        }
        const uri = `https://bitbucket.org/api/2.0/repositories/${project}/${repository}/pullrequests?limit=${limit}&state=OPEN`;
        const prs = await this._cacheRequester.get(uri);
        return JSON.parse(prs);
    }

    async getPullRequests(project: string, repository: string, limit: number): Promise<PullRequest[]> {
        const prs = await this.getPullRequestsResponse(project, repository, limit);

        const result: PullRequest[] = [];

        for (const pr of prs.values) {
            // fix url
            const commitUrl = pr.source.commit.links.self.href.replace('https://bitbucket.org/!api', 'https://bitbucket.org/api');
            this._logger.debug(`BitBucketClient.getPullRequests() - commitUrl: ${commitUrl}`);
            const commit: Commit = JSON.parse(await this._cacheRequester.get(commitUrl));
            result.push({
                id: String(pr.id),
                branch: pr.source.branch.name,
                commit: pr.source.commit.hash,
                date: commit.date,
            });
        }

        return result;
    }

    async getPullRequest(project: string, repository: string, id: string): Promise<PullRequestResponse> {
        const uri = `https://bitbucket.org/api/2.0/repositories/${project}/${repository}/pullrequests/${id}`;
        const pr = await this._cacheRequester.get(uri);
        return JSON.parse(pr);
    }

    async postBuildStatus(project: string, repository: string, commit: string, state: PullRequestState): Promise<PullRequestResponse> {
        const uri = `https://bitbucket.org/api/2.0/repositories/${project}/${repository}/commit/${commit}/statuses/build`;
        const respBody: string = await this._cacheRequester.post(uri, state);
        this._logger.debug(`BitBucketClient: postBuildStatus, respBody: ${respBody}`);
        return JSON.parse(respBody);
    }

    async getCommit(project: string, repository: string, commit: string): Promise<Commit> {
        const uri = `https://bitbucket.org/api/2.0/repositories/${project}/${repository}/commit/${commit}`;
        return JSON.parse(await this._cacheRequester.get(uri));
    }
}
