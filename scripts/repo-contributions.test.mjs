import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aggregate, renderMarkdown, renderSvg, replaceSection } from './repo-contributions.mjs';

const entry = (name, count, visibility = 'PUBLIC') => ({
  repository: { nameWithOwner: name, url: `https://github.com/${name}`, visibility },
  contributions: { totalCount: count },
});

test('adds four contribution types by public repository and sorts totals', () => {
  const repos = aggregate({
    commitContributionsByRepository: [entry('gelatoni-xh/b', 2), entry('gelatoni-xh/a', 3), entry('gelatoni-xh/secret', 9, 'PRIVATE'), entry('gelatoni-xh/internal', 4, 'INTERNAL')],
    pullRequestContributionsByRepository: [entry('gelatoni-xh/b', 2), entry('ZYZ666-RGB/project-quickstart-skill', 1)],
    issueContributionsByRepository: [entry('gelatoni-xh/a', 2)],
    pullRequestReviewContributionsByRepository: [entry('gelatoni-xh/b', 3)],
  });
  assert.deepEqual(repos.map(({ name, total }) => [name, total]), [['gelatoni-xh/b', 7], ['gelatoni-xh/a', 5]]);
  assert.equal(repos[0].reviews, 3);
  assert.equal(repos[0].commits, 2);
});

test('renders an escaped chart and a linked table', () => {
  const repos = [{ name: 'owner/a&b', url: 'https://github.com/owner/a-b', commits: 2, pullRequests: 1, issues: 0, reviews: 0, total: 3 }];
  assert.match(renderSvg(repos, '2026-10-20', '2026-11-19'), /owner\/a&amp;b/);
  assert.match(renderMarkdown(repos, '2026-10-20', '2026-11-19', true), /\[owner\/a&b\]\(https:\/\/github.com\/owner\/a-b\)/);
  assert.match(replaceSection('before\n<!-- TRAFFIC:START -->', 'chart'), /before\nchart\n\n<!-- TRAFFIC:START -->/);
  assert.equal(replaceSection('a <!-- CONTRIBUTIONS:START -->old<!-- CONTRIBUTIONS:END --> z', '<!-- CONTRIBUTIONS:START -->new<!-- CONTRIBUTIONS:END -->'), 'a <!-- CONTRIBUTIONS:START -->new<!-- CONTRIBUTIONS:END --> z');
});
