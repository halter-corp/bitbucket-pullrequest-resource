import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { PersistentCache } from './cache';
import { Logger } from './logger';
import { ConcourseFileSystem } from './concourse';
import * as retry from 'async-retry';

interface CachedUrl {
    etag: string;
    body: string;
}

export class CacheRequester {
    private _logger: Logger;
    private cache: PersistentCache;
    private basicAuth: {
        username: string;
        password: string;
    };
    private _retries: number;

    constructor(logger: Logger, cachePath: string, username: string, password: string, fs: ConcourseFileSystem) {
        this._logger = logger;
        this.basicAuth = {username, password};
        this.cache = new PersistentCache(cachePath, fs);
        this._retries = 10;
    }

    private async retryRequest(url: string, method: string, data: any | null): Promise<string> {
        let validStatuses: number[];
        if (method === 'get') {
            validStatuses = [200, 304];
        } else if (method === 'post') {
            validStatuses = [200, 201];
        } else {
            throw new Error('only get and post are implemented');
        }

        const requestConfig: AxiosRequestConfig = {
            url,
            method,
            auth: {
                username: this.basicAuth.username,
                password: this.basicAuth.password,
            },
            validateStatus: (status: number) => {
                return validStatuses.indexOf(status) > -1;
            },
        };

        if (method === 'get') {
            const cached = this.cache.get(url);
            let cachedUrl: CachedUrl;
            if (cached) {
                cachedUrl = JSON.parse(cached);
                requestConfig.headers = {'If-None-Match': cachedUrl.etag};
            }
        } else if (method === 'post') {
            requestConfig.data = data;
        }

        let attempt: number = 0;
        const resp: AxiosResponse = await retry(async (bail) => {
            this._logger.debug(`CacheRequester - ${method} attempt #${attempt}`);
            attempt++;
            const theResp = await axios(requestConfig);
            return theResp;
        }, {
            retries: this._retries,
            minTimeout: 1 * 1000, // 1 second
            maxTimeout: 20 * 1000, // 20 seconds
        } as retry.Options);

        if (resp == null) {
            throw new Error('response is null, probably should not happen');
        }

        this._logger.debug(`CacheRequester - ${method} - resp.status: ${resp.status}`);

        if (method === 'get') {
            if (resp.status === 200) {
                this._logger.debug(`CacheRequester: 200 from GET on ${url}`);
                this.cache.set(url, JSON.stringify({etag: resp.headers.etag, body: resp.data}));
                return JSON.stringify(resp.data);
            } else if (resp.status === 304) {
                this._logger.debug(`CacheRequester: 304 from GET on ${url}, using cache for response`);
                const cachedResp: CachedUrl = JSON.parse(this.cache.get(url));
                return JSON.stringify(cachedResp.body);
            } else {
                throw new Error(`this should not really happen, resp.status === ${resp.status}`);
            }
        } else if (method === 'post') {
            if (resp.status === 200) {
                this._logger.debug(`CacheRequester: 200 from POST on ${url}`);
                return JSON.stringify(resp.data);
            } else if (resp.status === 201) {
                this._logger.debug(`CacheRequester: 201 from POST on ${url}`);
                return JSON.stringify(resp.data);
            } else {
                this._logger.debug(`CacheRequester: ${resp.status} from POST on ${url}`);
                throw new Error(`post: resp.status === ${resp.status}`);
            }
        }
        return '';
    }

    async get(url: string): Promise<string> {
        return this.retryRequest(url, 'get', null);
    }

    async post(url: string, data: any): Promise<string> {
        return this.retryRequest(url, 'post', data);
    }
}
