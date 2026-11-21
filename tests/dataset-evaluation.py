"""Exercise the production Next.js API with a disposable Prisma database and loopback model."""
import collections
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import socket
import shutil
import sys
import sqlite3
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

root = Path(__file__).resolve().parents[1]
requests = []
allow_response = threading.Event()
request_started = threading.Event()
failure_counts = collections.Counter()
size = 2005

class Model(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        text = body['messages'][-1]['content']
        requests.append(body)
        state = text.split('|', 1)[0]
        status = 200
        score = {'V1': 1, 'V3': 4.5, 'ZERO': 0, 'HALF': 0.5}.get(state, 4.5)
        content = json.dumps({'score': score, 'evaluation': f'{state} checked'})
        if state == 'BAD':
            content = 'invalid response'
        if state == 'FAIL':
            status = 400
        if state == 'RETRY':
            failure_counts[text] += 1
            if failure_counts[text] == 1:
                status = 429 if 'a0000' in text else 408
        if state == 'HOLD' or (state == 'RESTART' and 'Question a0000|' not in text):
            request_started.set()
            allow_response.wait(10)
        response = {'id': 'test', 'model': body['model'], 'object': 'chat.completion', 'created': 1,
                    'choices': [{'index': 0, 'message': {'role': 'assistant', 'content': content}, 'finish_reason': 'stop'}]}
        data = json.dumps(response if status == 200 else {'error': {'message': 'test failure'}}).encode()
        try:
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except (BrokenPipeError, ConnectionResetError):
            if state != 'RESTART':
                raise

def check(condition, label):
    assert condition, label
    print('PASS', label, flush=True)

def run(db, port, mock, restart):
    db.row_factory = sqlite3.Row
    model = {'modelId': 'synthetic-v3', 'modelName': 'synthetic', 'providerId': 'openai',
             'endpoint': f'http://127.0.0.1:{mock.server_port}/v1', 'apiKey': 'synthetic-key',
             'temperature': 0, 'topP': 0.8, 'maxTokens': 128}
    def request(path, body=None, method=None, status=200):
        req = urllib.request.Request(f'http://127.0.0.1:{port}{path}',
              json.dumps(body).encode() if body is not None else None,
              {'Content-Type': 'application/json'}, method=method)
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                assert res.status == status
                data = res.read()
                return json.loads(data) if 'json' in res.headers['Content-Type'] else data
        except urllib.error.HTTPError as err:
            assert err.code == status, (err.code, err.read()[:600])
            return json.loads(err.read())
    def insert(table, **columns):
        for c in db.execute(f'pragma table_info({table})'):
            if c['name'] not in columns and c['notnull'] and c['dflt_value'] is None:
                columns[c['name']] = '2026-11-21 00:00:00' if c['type'] == 'DATETIME' else ''
        db.execute(f"insert into {table}({','.join(columns)}) values ({','.join('?' for _ in columns)})", tuple(columns.values()))
    def change_prompt(version):
        template = version + '|{{question}}|{{answer}}|{{chunkContent}}'
        db.execute('update CustomPrompts set content=? where id=?', (template, 'rubric'))
        db.commit()
        return hashlib.sha256(template.encode()).hexdigest()
    def grades():
        return {r['id']: (r['score'], r['aiEvaluation']) for r in db.execute('select * from Datasets')}
    def originals():
        return [tuple(row) for row in db.execute('select id,projectId,question,answer,tags,note from Datasets order by id')]
    for project in ('A', 'B'):
        insert('Projects', id=project, name='Synthetic '+project)
    insert('CustomPrompts', id='rubric', projectId='A', promptType='datasetEvaluation',
           promptKey='DATASET_EVALUATION_PROMPT', language='zh-CN', content='V1|{{question}}|{{answer}}|{{chunkContent}}')
    ids = [f'a{i:04}' for i in range(size)]
    for i in ids + ['other']:
        insert('Datasets', id=i, projectId='B' if i == 'other' else 'A', question='Question '+i,
               answer='Answer $& {{question}} '+i, chunkContent='Source '+i, tags='["synthetic"]', note='original')
    db.commit()
    original = originals()
    api = '/api/projects/A/datasets'
    task_api = '/api/projects/A/tasks/'
    def start(mode, count, **extra):
        body = {'model': model, 'mode': mode, **extra}
        preview = request(api+'/batch-evaluate', {**body, 'preview': True})
        assert preview['count'] == count, preview
        return request(api+'/batch-evaluate', {**body, 'confirmedCount': count})['data']['taskId']
    def finish(task_id, expected, final=1, require_note=False):
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            row = db.execute('select * from Task where id=?', (task_id,)).fetchone()
            log = json.loads(row['detail'])
            if row['endTime'] and len(log['results']) == len(expected) and (not require_note or 'not run:' in row['note']):
                assert row['status'] == final, row['note']
                assert row['totalCount'] == len(expected)
                assert {r['datasetId'] for r in log['results']} == set(expected) and len(log['results']) == len(expected)
                assert row['completedCount'] == sum(r['status'] in ('succeeded', 'failed') for r in log['results'])
                return log
            time.sleep(0.05)
        raise AssertionError(f'Task timed out {task_id}')
    # Wait for first route compilation/startup recovery before creating tasks.
    request(task_api+'list')
    log = finish(start('unscored', size), ids)
    scored = grades()
    check(all(scored[i][0] == 1 for i in ids) and len(requests) == size, 'all ungraded, >2000, V1 full write coverage')
    check(request(api+'/batch-evaluate', {'model': model,'preview':True})['count'] == 0, 'all previously graded')
    v3_hash = change_prompt('V3')
    before = len(requests)
    log = finish(start('all', size, scoreRange='0-0', search='no match'), ids)
    scored = grades()
    check(all(scored[i] == (4.5, 'V3 checked') for i in ids) and len(requests) == before+size and log['promptHash'] == v3_hash,
          'V3 forced all, ignored unrelated filters, all 2005 IDs changed from 1 to 4.5')
    sample = [ids[0], ids[-1]]
    for i in sample:
        batch_body = next(req for req in requests[before:] if 'Question '+i+'|' in req['messages'][-1]['content'])
        result = request(api+'/'+i+'/evaluate', {'model': model})
        assert result['data']['score'] == 4.5 and requests[-1] == batch_body
        assert batch_body['temperature'] == 0 and batch_body['top_p'] == 0.8 and batch_body['max_tokens'] == 128
    check(True, 'single/batch HTTP body parity including model, literal variables and temperature 0')
    for version, expected in [('ZERO', 0), ('HALF', 0.5)]:
        change_prompt(version)
        mark = len(requests)
        finish(start('selected', 2, datasetIds=[*sample,*sample]), sample)
        check(len(requests)==mark+2 and all(grades()[i][0] == expected for i in sample), f'cross-page selected, deduplicated, score {expected}')
        assert request(api+'/batch-evaluate', {'model':model,'preview':True})['count'] == 0
    db.execute('update Datasets set aiEvaluation=? where id=?', ('',ids[1]));db.commit()
    change_prompt('V3')
    finish(start('unscored', 1), [ids[1]])
    check(grades()[ids[1]][0] == 4.5, 'mixed legacy scored and unscored records')
    request(api+'/batch-evaluate', {'model':model,'mode':'selected','datasetIds':['other'],'preview':True},status=400)
    check(grades()['other'] == (0,''), 'other project isolated')
    for version, reason in [('FAIL', 'model_request_failed'),('BAD','invalid_model_result')]:
        change_prompt(version)
        old = grades()
        failing = start('selected',1,datasetIds=[ids[0]])
        log = finish(failing, [ids[0]], final=2)
        check(grades()==old and log['results'][0]['error']==reason, reason+' preserves original grade')
    change_prompt('V3')
    db.execute("create trigger fail_write before update of score on Datasets when NEW.id = 'a0000' begin select raise(ABORT,'synthetic rejection'); end")
    db.commit()
    old = grades()
    partial = start('selected',2,datasetIds=sample)
    log = finish(partial,sample,final=2)
    check(grades()[ids[0]]==old[ids[0]] and any(r.get('error')=='database_write_failed' for r in log['results']), 'database write failure audited')
    db.execute('drop trigger fail_write');db.commit()
    finish(start('failed',1,retryTaskId=partial),[ids[0]])
    check(grades()[ids[0]]==(4.5,'V3 checked'), 'only failed sample retried')
    change_prompt('RETRY')
    log = finish(start('selected',2,datasetIds=sample),sample)
    check(all(r['retries']==1 and r['writeSucceeded'] for r in log['results']), 'parallel HTTP timeout and rate-limit retries counted exactly once')
    change_prompt('HOLD')
    request_started.clear()
    allow_response.clear()
    held = start('selected', 7, datasetIds=ids[:7])
    assert request_started.wait(10)
    change_prompt('V1')
    allow_response.set()
    frozen = finish(held, ids[:7])
    assert all(grades()[i] == (4.5, 'HOLD checked') for i in ids[:7])
    check(True, 'in-flight prompt edit affects the next task only')
    change_prompt('HOLD')
    request_started.clear()
    allow_response.clear()
    held = start('selected', 1, datasetIds=[ids[0]])
    assert request_started.wait(10)
    change_prompt('V1')
    request(api+'/'+ids[0]+'/evaluate', {'model': model})
    allow_response.set()
    log = finish(held, [ids[0]], final=2)
    check(grades()[ids[0]] == (1, 'V1 checked') and log['results'][0]['error'] == 'dataset_changed',
          'stale batch cannot overwrite a completed single evaluation')
    change_prompt('HOLD')
    request_started.clear()
    allow_response.clear()
    old = grades()
    held = start('selected',1,datasetIds=[ids[0]])
    assert request_started.wait(10)
    request(task_api+held, {'status':3}, method='PATCH')
    allow_response.set()
    log = finish(held,[ids[0]],final=3,require_note=True)
    check(grades()==old and log['results'][0]['status']=='cancelled', 'cancel during API call leaves previous score')
    recovered_cancel = None
    for cancel in (True, False):
        targets = ids[:7]
        change_prompt('RESTART')
        request_started.clear()
        allow_response.clear()
        before_job_calls = len(requests)
        job_id = start('selected', len(targets), datasetIds=targets)
        assert request_started.wait(10)
        deadline = time.monotonic() + 10
        while time.monotonic() < deadline:
            if (db.execute('select completedCount from Task where id=?', (job_id,)).fetchone()[0] == 1
                    and len(requests) >= before_job_calls + 6):
                break
            time.sleep(0.05)
        else:
            raise AssertionError('The first score was not committed before interruption')
        if cancel:
            request(task_api+job_id, {'status': 3}, method='PATCH')
        old = grades()
        calls = len(requests)
        restart()
        allow_response.set()
        # A task-list visit is enough to run recovery after a fresh server start.
        request(task_api+'list')
        if recovered_cancel:
            cancel_id, cancel_detail = recovered_cancel
            assert request(task_api+cancel_id)['data'] == cancel_detail
        recovered = request(task_api+job_id)['data']
        if cancel:
            recovered_cancel = (job_id, recovered)
        finished = finish(job_id, targets, final=3 if cancel else 2, require_note=True)
        remaining = {row['datasetId'] for row in finished['results'] if row['status'] == 'unexecuted'}
        assert remaining == set(targets[1:]) and recovered['canRetryEvaluation']
        assert recovered['completedCount'] == 1 and grades() == old and len(requests) == calls
        check(True, 'restart fills audit without writes or API calls (cancelled)' if cancel
              else 'restart fills audit without writes or API calls (interrupted)')
        body = {'model': model, 'mode': 'failed', 'retryTaskId': job_id, 'preview': True}
        assert request(api+'/batch-evaluate', body)['count'] == len(remaining)
        assert len(requests) == calls
        if not cancel:
            change_prompt('V1')
            finish(start('failed', len(remaining), retryTaskId=job_id), remaining)
            assert len(requests) == calls + len(remaining)
            assert all(grades()[i] == old[i] for i in set(old) - remaining)
            check(True, 'confirmed retry processes only unfinished targets')
    check(originals()==original, 'original IDs, question, answer, tags and notes retained')
    assert 'synthetic-key' not in db.execute('select modelInfo from Task where id=?',(partial,)).fetchone()[0]
    detail = request(task_api+partial)['data']
    check('synthetic-key' not in json.dumps(detail) and 'Question a' not in json.dumps(detail), 'task API contains no credential or training text')
    page = request('/projects/A/datasets')
    check(b'/_next/static/' in page, 'production dataset page serves frontend assets')

if __name__ == '__main__':
    with tempfile.TemporaryDirectory(prefix='evaluation-test-', dir=root / 'prisma') as folder:
        database = Path(folder) / 'test.sqlite'
        env = dict(os.environ, DATABASE_URL='file:'+database.as_posix(), NEXT_TELEMETRY_DISABLED='1',
                   RAYON_NUM_THREADS='2')
        if len(sys.argv) != 2:
            raise SystemExit('Pass the path to an empty SQLite database created by prisma db push')
        shutil.copyfile(sys.argv[1], database)
        with closing(sqlite3.connect(database)) as clean:
            clean.execute('pragma journal_mode=WAL')
            for table in ('Projects', 'Datasets', 'Task'):
                if clean.execute(f'select count(*) from {table}').fetchone()[0]:
                    raise SystemExit('The fixture database must contain no projects, datasets or jobs')
        mock = ThreadingHTTPServer(('127.0.0.1', 0), Model)
        threading.Thread(target=mock.serve_forever, daemon=True).start()
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        with open(Path(folder)/'next.log','w+',encoding='utf8') as log:
            def launch():
                child = subprocess.Popen(
                    ['node', 'node_modules/next/dist/bin/next', os.environ.get('EVALUATION_TEST_NEXT', 'start'),
                     '-H', '127.0.0.1', '-p', str(port)],
                    cwd=root, env=env, stdout=log, stderr=subprocess.STDOUT
                )
                try:
                    for _ in range(100):
                        try:
                            with socket.create_connection(('127.0.0.1', port), .2):
                                return child
                        except OSError:
                            if child.poll() is not None:
                                raise RuntimeError('Next.js exited')
                            time.sleep(.2)
                    raise RuntimeError('Next.js did not open its port')
                except BaseException:
                    child.kill()
                    child.wait(timeout=20)
                    raise

            def restart():
                global app
                app.kill()
                app.wait(timeout=20)
                app = launch()

            app = launch()
            try:
                with closing(sqlite3.connect(database, timeout=20)) as db:
                    run(db, port, mock, restart)
            except BaseException:
                log.seek(0)
                print(log.read()[-4000:])
                raise
            finally:
                allow_response.set()
                app.terminate()
                app.wait(timeout=20)
                mock.shutdown()
