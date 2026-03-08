import { createHash } from 'node:crypto';
import { chmod, mkdtemp, mkdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { getFileFingerprint } from '.';

import type { Stats } from 'node:fs';

async function createTempDir() {
  return mkdtemp(path.join(tmpdir(), 'get-file-fingerprint-'));
}

async function expectedHashFromFile({
  filePath,
  sampleSize,
  algorithm,
  identity,
}: {
  filePath: string;
  sampleSize: number;
  algorithm: string;
  identity: object;
}) {
  const content = await readFile(filePath);
  const sample = content.subarray(0, sampleSize + 1);

  const hash = createHash(algorithm);
  hash.update(sample);
  hash.update(JSON.stringify(identity));

  return hash.digest('hex');
}

describe('getFileFingerprint', () => {
  const createdDirs: string[] = [];

  afterEach(async () => {
    await Promise.all(createdDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
  });

  it('should return success with fingerprint for a valid file path', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'file.txt');
    await writeFile(filePath, 'mustib-utils fingerprint sample');

    const result = await getFileFingerprint({ filePath });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.fingerprint).toMatch(/^[a-f0-9]{32}$/);
    }
  });

  it('should generate the same fingerprint for the same file and options', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'same.txt');
    await writeFile(filePath, 'same content');

    const first = await getFileFingerprint({ filePath });
    const second = await getFileFingerprint({ filePath });

    expect(first).toEqual(second);
  });

  it('should use provided hash algorithm', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'algo.txt');
    await writeFile(filePath, 'algorithm test');

    const result = await getFileFingerprint({ filePath, hashAlgorithm: 'sha256' });

    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.data.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('should respect sampleSize when generating fingerprints', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const fileAPath = path.join(dir, 'a.txt');
    const fileBPath = path.join(dir, 'b.txt');

    await writeFile(fileAPath, 'same-prefix-A-diff-tail-11111');
    await writeFile(fileBPath, 'same-prefix-A-diff-tail-22222');

    const smallSampleA = await getFileFingerprint({
      filePath: fileAPath,
      sampleSize: 5,
      identityData: {},
    });
    const smallSampleB = await getFileFingerprint({
      filePath: fileBPath,
      sampleSize: 5,
      identityData: {},
    });

    expect(smallSampleA.status).toBe('success');
    expect(smallSampleB.status).toBe('success');
    if (smallSampleA.status === 'success' && smallSampleB.status === 'success') {
      expect(smallSampleA.data.fingerprint).toBe(smallSampleB.data.fingerprint);
    }

    const largeSampleA = await getFileFingerprint({
      filePath: fileAPath,
      sampleSize: 25,
      identityData: {},
    });
    const largeSampleB = await getFileFingerprint({
      filePath: fileBPath,
      sampleSize: 25,
      identityData: {},
    });

    expect(largeSampleA.status).toBe('success');
    expect(largeSampleB.status).toBe('success');
    if (largeSampleA.status === 'success' && largeSampleB.status === 'success') {
      expect(largeSampleA.data.fingerprint).not.toBe(largeSampleB.data.fingerprint);
    }
  });

  it('should use default identity data (size and mtime)', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'identity-default.txt');
    await writeFile(filePath, 'identity default data');

    const statsBefore = await stat(filePath);

    const result = await getFileFingerprint({ filePath, sampleSize: 100 });

    expect(result.status).toBe('success');

    const expected = await expectedHashFromFile({
      filePath,
      sampleSize: 100,
      algorithm: 'md5',
      identity: {
        size: statsBefore.size,
        mtime: statsBefore.mtimeMs,
      },
    });

    if (result.status === 'success') {
      expect(result.data.fingerprint).toBe(expected);
    }
  });

  it('should use custom identity object when provided', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'identity-object.txt');
    await writeFile(filePath, 'stable content');

    const identityData = { fixed: 'identity' };

    const first = await getFileFingerprint({ filePath, identityData });

    const now = new Date();
    await utimes(filePath, now, new Date(now.getTime() + 10_000));

    const second = await getFileFingerprint({ filePath, identityData });

    expect(first.status).toBe('success');
    expect(second.status).toBe('success');

    if (first.status === 'success' && second.status === 'success') {
      expect(first.data.fingerprint).toBe(second.data.fingerprint);
    }
  });

  it('should use identity callback with file stats', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'identity-callback.txt');
    await writeFile(filePath, 'callback identity sample');

    const identityData = vi.fn(({ stats }: { stats: Stats }) => ({
      onlySize: stats.size,
    }));

    const result = await getFileFingerprint({ filePath, identityData });

    expect(identityData).toHaveBeenCalledTimes(1);
    expect(identityData.mock.calls[0]?.[0]?.stats?.isFile?.()).toBe(true);
    expect(result.status).toBe('success');
  });

  it('should return not a file error when path is a directory', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const dirPath = path.join(dir, 'nested');
    await mkdir(dirPath);

    const result = await getFileFingerprint({ filePath: dirPath });

    expect(result).toEqual({
      status: 'error',
      data: {
        message: 'not a file',
        context: {
          filePath: dirPath,
        },
      },
    });
  });

  it('should reject when stat fails (e.g. missing file)', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const missingPath = path.join(dir, 'missing.txt');

    await expect(getFileFingerprint({ filePath: missingPath })).rejects.toThrow();
  });

  it('should return error when reading file sample fails', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'unreadable.txt');
    await writeFile(filePath, 'this file will become unreadable');

    await chmod(filePath, 0o000);

    const result = await getFileFingerprint({ filePath });

    await chmod(filePath, 0o600);

    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.data.message).toBe('failed to read file sample');
      expect(result.data.context).toMatchObject({
        filePath,
      });
      expect(result.data.context).toHaveProperty('err');
    }
  });

  it('should reject when hash algorithm is invalid', async () => {
    const dir = await createTempDir();
    createdDirs.push(dir);

    const filePath = path.join(dir, 'invalid-algo.txt');
    await writeFile(filePath, 'invalid algo content');

    await expect(
      getFileFingerprint({ filePath, hashAlgorithm: 'not-a-real-hash' }),
    ).rejects.toThrow();
  });
});
