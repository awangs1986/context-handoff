// Re-score saved ConFiQA-derived Pi runs without overwriting their first score.
import { readFile, writeFile, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { scoreConfiqaProcedure } from './score-confiqa-procedure.mjs';

const repo = resolve(fileURLToPath(new URL('..', import.meta.url)));
const directories = process.argv.slice(2);
if (!directories.length) throw Error('Usage: node scripts/rescore-confiqa.mjs OUTSIDE_REPO_RUN_DIR...');
for (const argument of directories) {
  const root = resolve(argument);
  if (!relative(repo, root).startsWith('..')) throw Error('Run artifacts must remain outside Git');
  const output = join(root, 'score-rescored-v2.json');
  try { await stat(output); throw Error(`Existing rescore would be overwritten: ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  const scoreBytes = await readFile(join(root, 'score.json'));
  const entriesBytes = await readFile(join(root, 'entries.json'));
  const prior = JSON.parse(scoreBytes);
  const entries = JSON.parse(entriesBytes).entries;
  if (!prior.marker || !prior.expected || !Array.isArray(entries))
    throw Error(`Not a ConFiQA run: ${root}`);
  const procedure = scoreConfiqaProcedure(entries, prior.marker, prior.expected);
  const requests = JSON.parse(await readFile(join(root, 'requests.json')));
  const providerErrors = requests.filter(row => row.error || row.status >= 400).map(row => ({
    n: row.n, status: row.status, error: row.error,
  }));
  const pass = providerErrors.length === 0 && prior.answerCorrect &&
    prior.exactKeys && procedure.valid && prior.boundaryCount === 4 &&
    prior.sessionStable && prior.userMessages === 4 && prior.protectedIntact &&
    !prior.error && prior.compactionEvents?.length === 4 &&
    prior.compactionEvents.every(event =>
      event.reason === 'threshold' && !event.error && !event.aborted) &&
    prior.fourthKind === (prior.arm === 'native' ? 'native' : 'handoff');
  const sha = bytes => createHash('sha256').update(bytes).digest('hex');
  const rescored = { ...prior, priorPass: prior.pass, pass,
    scoringRevision: 'successful-verified-search-read-before-first-successful-answer-write',
    scoreSha256: sha(scoreBytes), entriesSha256: sha(entriesBytes),
    providerErrors, procedure,
    searchAfter: procedure.searchCalls,
    readAfterSearch: procedure.verifiedReadAfterSearch };
  await writeFile(output, JSON.stringify(rescored, null, 2));
  console.log(JSON.stringify({ directory: root, priorPass: prior.pass,
    pass, procedure }));
}
