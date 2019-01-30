import { PersistentCache } from './cache';
import { ConcourseFileSystem } from './concourse';

describe('cache', () => {
    let fsSpyWriteFileSync;
    let fsSpyReadFileSync;
    let fsSpyExistsSync;

    const fs: ConcourseFileSystem = {
        writeFileSync: jest.fn(),
        readFileSync: jest.fn(),
        existsSync: jest.fn(),
        appendFileSync: jest.fn(),
    };

    beforeAll(async () => {
        fsSpyWriteFileSync = jest.spyOn(fs, 'writeFileSync');
        fsSpyReadFileSync = jest.spyOn(fs, 'readFileSync');
        fsSpyExistsSync = jest.spyOn(fs, 'existsSync');
    });

    beforeEach(() => {
        fsSpyWriteFileSync.mockClear();
        fsSpyReadFileSync.mockClear();
        fsSpyExistsSync.mockClear();
    });

    it('parses filesystem correctly', async () => {
        const fsRead = '{"test": "abc", "test2": "def"}';
        fsSpyExistsSync.mockReturnValue(true);
        fsSpyReadFileSync.mockReturnValue(Buffer.from(fsRead, 'utf8'));

        const cache = new PersistentCache('/tmp/abc', fs);
        expect(cache.get('test')).toEqual('abc');
        expect(cache.get('test2')).toEqual('def');
    });

    it('stores json on filesystem', async () => {
        fsSpyExistsSync.mockReturnValue(true);
        fsSpyReadFileSync.mockReturnValue(Buffer.from('{}', 'utf8'));
        fsSpyWriteFileSync.mockReturnValue();

        const cache = new PersistentCache('/tmp/abc', fs);

        cache.set('a', 'abc');

        expect(fsSpyWriteFileSync).toHaveBeenNthCalledWith(1, '/tmp/abc', '{"a":"abc"}');

        fsSpyReadFileSync.mockReturnValue(Buffer.from('{"a":"abc"}', 'utf8'));

        cache.set('b', 'def');

        expect(fsSpyWriteFileSync).toHaveBeenNthCalledWith(2, '/tmp/abc', '{"a":"abc","b":"def"}');

        fsSpyReadFileSync.mockReturnValue(Buffer.from('{"a":"abc","b":"def"}', 'utf8'));

        expect(cache.get('a')).toEqual('abc');
        expect(cache.get('b')).toEqual('def');
    });

    it('returns empty string for key that does not exist', async () => {
        fsSpyExistsSync.mockReturnValue(true);
        fsSpyReadFileSync.mockReturnValue(Buffer.from('{}', 'utf8'));

        const cache = new PersistentCache('tmp/abc', fs);
        expect(cache.get('a')).toEqual('');
    });
});
