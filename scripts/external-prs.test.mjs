import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeItems, renderMarkdown, replaceSection } from './external-prs.mjs';

const item = (url, mergedAt, title = 'Fix something', repository = 'owner/repo', number = 1) => ({
  url, mergedAt, title, repository, number,
});

test('merges external PR records by URL and sorts newest first', () => {
  const result = mergeItems(
    [item('https://github.com/a/1', '2026-11-19T10:00:00Z', 'old')],
    [item('https://github.com/a/1', '2026-11-19T10:00:00Z', 'updated'), item('https://github.com/b/2', '2026-11-21T10:00:00Z')],
  );
  assert.deepEqual(result.map(({ url, title }) => [url, title]), [
    ['https://github.com/b/2', 'Fix something'],
    ['https://github.com/a/1', 'updated'],
  ]);
});

test('renders date groups and comma-style PR links', () => {
  const markdown = renderMarkdown([
    item('https://github.com/a/1', '2026-11-21T10:00:00Z', 'New PR', 'a/repo', 2),
    item('https://github.com/b/2', '2026-11-21T09:00:00Z', 'Another PR', 'b/repo', 3),
  ], true);
  assert.match(markdown, /## 已合并的外部 PR/);
  assert.match(markdown, /\[a\/repo#2\].*、.*\[b\/repo#3\]/);
  assert.match(renderMarkdown([
    item('https://github.com/a/1', '2026-11-21T10:00:00Z', 'New PR', 'a/repo', 2),
    item('https://github.com/b/2', '2026-11-21T09:00:00Z', 'Another PR', 'b/repo', 3),
  ]), /\[a\/repo#2\].*, .*\[b\/repo#3\]/);
  assert.match(replaceSection('before\n<!-- TRAFFIC:START -->', markdown), /before\n<!-- EXTERNAL-PRS:START -->/);
});

test('rejects incomplete or duplicate sections', () => {
  assert.throws(() => replaceSection('<!-- EXTERNAL-PRS:START -->', 'x'), /Incomplete/);
  assert.throws(() => replaceSection('<!-- EXTERNAL-PRS:START -->a<!-- EXTERNAL-PRS:END --><!-- EXTERNAL-PRS:START -->b<!-- EXTERNAL-PRS:END -->', 'x'), /Duplicate/);
});
