export interface SourceConfig {
    username: string;
    password: string;
    project: string;
    repository: string;
    limit: number;
    job_url: string;
    git: {
        uri: string;
        private_key: string;
    };
    log_level?: string;
}

export interface Version {
    commit: any;
    id: string;
    branch: string;
    date: string;
}

export interface ConcourseRequest {
    source: SourceConfig;
    version?: Version;
    params?: Params;
}

export interface Params {
    state: string;
    name: string;
    description?: string;
    path: string;
}

export interface Metadata {
    name: string;
    value: string;
}

export interface ConcourseResponse {
    version: Version;
    metadata: Metadata[];
}

export interface PullRequestInfo {
    id: string;
    description: string;
    author: {
        name: string;
        fullname: string;
    };
    commit: string;
    feature_branch: string;
    title: string;
    upstream_branch: string;
    url: string;
    updated_at: string;
    concourse: {
        version: Version;
    };
}

export interface ConcourseFileSystem {
    readFileSync(path: string): Buffer;
    appendFileSync(path: string, data: string);
    writeFileSync(path: string, data: string);
    existsSync(path: string): boolean;
}
