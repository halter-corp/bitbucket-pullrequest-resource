import { serialize } from 'class-transformer';
import { ConcourseFileSystem } from './concourse';

export class PersistentCache {
    private cache: Map<string, string>;
    private cachePath: string;
    private _fs: ConcourseFileSystem;

    constructor(path: string, fs: ConcourseFileSystem) {
        this.cachePath = path;
        this._fs = fs;

        if (!this._fs.existsSync(this.cachePath)) {
            this._fs.writeFileSync(this.cachePath, serialize(new Map<string, string>()));
        }

        this.cache = this.parseFile();
    }

    private parseFile(): Map<string, string> {
        const result = new Map<string, string>();
        const j = JSON.parse(this._fs.readFileSync(this.cachePath).toString());
        for (const key of Object.keys(j)) {
            result.set(key, j[key]);
        }

        return result;
    }

    get(k: string): string {
        this.cache = this.parseFile();
        const result = this.cache.get(k);
        if (result) {
            return result;
        }
        return '';
    }

    set(k: string, v: string) {
        this.cache.set(k, v);
        this._fs.writeFileSync(this.cachePath, serialize(this.cache));
    }
}
