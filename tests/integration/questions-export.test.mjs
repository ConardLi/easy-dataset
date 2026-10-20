import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { PrismaClient } from '@prisma/client';

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(testDirectory, '..', '..');

// Reproduced on the pre-fix route: labeled exports returned questionLabel: "",
// while every non-empty search returned HTTP 500 with "Unknown argument `questionLabel`".

async function getAvailablePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  await new Promise((resolve, reject) => server.close(error => (error ? reject(error) : resolve())));
  return port;
}

async function waitForServer(server, baseUrl) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(`${baseUrl}/api/projects/project-a/questions/export`, {
        signal: AbortSignal.timeout(1000)
      });
      if (response.status > 0) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Timed out waiting for Next');
}

async function stopServer(server) {
  if (!server || server.exitCode !== null || server.signalCode !== null) return;

  const exited = new Promise(resolve => server.once('exit', resolve));
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(server.pid), '/t', '/f'], { stdio: 'ignore' });
  } else {
    server.kill('SIGTERM');
  }

  await Promise.race([exited, delay(5000)]);
  if (server.exitCode === null && server.signalCode === null) server.kill('SIGKILL');
}

async function seed(databaseUrl) {
  const db = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await db.projects.createMany({
      data: [
        { id: 'project-a', name: 'Synthetic A', description: '' },
        { id: 'project-b', name: 'Synthetic B', description: '' }
      ]
    });
    await db.chunks.createMany({
      data: [
        {
          id: 'chunk-a-budget',
          projectId: 'project-a',
          fileId: 'file-a',
          fileName: 'a.md',
          name: 'Budget Chunk',
          content: 'synthetic',
          summary: '',
          size: 9
        },
        {
          id: 'chunk-a-empty',
          projectId: 'project-a',
          fileId: 'file-a',
          fileName: 'a.md',
          name: 'Empty Chunk',
          content: 'synthetic',
          summary: '',
          size: 9
        },
        {
          id: 'chunk-b',
          projectId: 'project-b',
          fileId: 'file-b',
          fileName: 'b.md',
          name: 'Foreign Chunk',
          content: 'synthetic',
          summary: '',
          size: 9
        }
      ]
    });
    await db.questions.createMany({
      data: [
        {
          id: 'question-a-labeled',
          projectId: 'project-a',
          chunkId: 'chunk-a-budget',
          question: 'Alpha budget?',
          label: 'finance',
          createAt: new Date('2026-01-03T00:00:00Z')
        },
        {
          id: 'question-a-empty',
          projectId: 'project-a',
          chunkId: 'chunk-a-empty',
          question: 'Empty label prompt',
          label: '',
          createAt: new Date('2026-01-02T00:00:00Z')
        },
        {
          id: 'question-a-image',
          projectId: 'project-a',
          chunkId: 'chunk-a-budget',
          question: 'Image prompt',
          label: 'vision',
          imageId: 'image-a',
          imageName: 'image.png',
          createAt: new Date('2026-01-01T00:00:00Z')
        },
        {
          id: 'question-b',
          projectId: 'project-b',
          chunkId: 'chunk-b',
          question: 'Alpha foreign',
          label: 'finance',
          createAt: new Date('2026-01-04T00:00:00Z')
        }
      ]
    });
  } finally {
    await db.$disconnect();
  }
}

test('question export uses the Questions label field', { timeout: 60000 }, async t => {
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'easy-dataset-question-export-'));
  let server;
  t.after(async () => {
    await stopServer(server);
    await rm(temporaryDirectory, { recursive: true, force: true });
  });

  const databasePath = path.join(temporaryDirectory, 'test.sqlite').replaceAll('\\', '/');
  const databaseUrl = `file:${databasePath}`;
  const env = {
    ...process.env,
    DATABASE_URL: databaseUrl,
    NEXT_TELEMETRY_DISABLED: '1'
  };

  const prismaResult = spawnSync(
    process.execPath,
    [
      path.join(projectRoot, 'node_modules', 'prisma', 'build', 'index.js'),
      'db',
      'push',
      '--schema',
      path.join(projectRoot, 'prisma', 'schema.prisma'),
      '--skip-generate'
    ],
    { cwd: projectRoot, env, encoding: 'utf8', windowsHide: true }
  );
  assert.equal(prismaResult.status, 0, prismaResult.stderr || prismaResult.stdout);
  await seed(databaseUrl);

  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(
    process.execPath,
    [path.join(projectRoot, 'node_modules', 'next', 'dist', 'bin', 'next'), 'dev', '-H', '127.0.0.1', '-p', String(port)],
    { cwd: projectRoot, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true }
  );
  let stdout = '';
  let stderr = '';
  server.stdout.on('data', chunk => (stdout += chunk));
  server.stderr.on('data', chunk => (stderr += chunk));

  try {
    await waitForServer(server, baseUrl);
  } catch (error) {
    assert.fail(`${error.message}\n--- Next stdout ---\n${stdout}\n--- Next stderr ---\n${stderr}`);
  }

  async function exportQuestions(projectId, body) {
    const response = await fetch(`${baseUrl}/api/projects/${projectId}/questions/export`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    assert.equal(
      response.status,
      200,
      `Expected export to succeed, received ${response.status}: ${JSON.stringify(payload)}`
    );
    return payload;
  }

  const labeled = { question: 'Alpha budget?', chunkName: 'Budget Chunk', questionLabel: 'finance' };
  const empty = { question: 'Empty label prompt', chunkName: 'Empty Chunk', questionLabel: '' };
  const image = { question: 'Image prompt', chunkName: 'Budget Chunk', questionLabel: 'vision' };

  await t.test('selected export preserves labels and project isolation', async () => {
    const result = await exportQuestions('project-a', {
      format: 'json',
      selectedIds: ['question-a-labeled', 'question-a-empty', 'question-b']
    });
    assert.deepEqual(result, [labeled, empty]);
    assert.equal(
      result[0].questionLabel,
      'finance',
      'Regression: before #747, the selected export returned an empty questionLabel here'
    );
  });

  await t.test('all export preserves non-empty and empty labels', async () => {
    assert.deepEqual(await exportQuestions('project-a', { format: 'json', filters: {} }), [labeled, empty, image]);
  });

  await t.test('non-empty searches use label and question fields', async () => {
    assert.deepEqual(
      await exportQuestions('project-a', { format: 'json', filters: { searchTerm: 'vision' } }),
      [image],
      'Regression: before #747, every non-empty search returned HTTP 500 because questionLabel is not a Questions field'
    );
    assert.deepEqual(await exportQuestions('project-a', { format: 'json', filters: { searchTerm: 'Alpha' } }), [
      labeled
    ]);
  });

  await t.test('format variants receive the corrected route payload', async () => {
    for (const format of ['json', 'jsonl', 'csv']) {
      assert.deepEqual(
        await exportQuestions('project-a', { format, selectedIds: ['question-a-labeled', 'question-a-empty'] }),
        [labeled, empty]
      );
    }
  });
});
