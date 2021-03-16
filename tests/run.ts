import * as fs from 'fs';
import fetch from 'node-fetch';
import * as Diff from 'diff';
import stringify from 'fast-json-stable-stringify'


const GRAPH_SERVER_URL = 'http://localhost:8100/subgraphs/name/my-swarm/issuance';

async function runQuery(query: string) {
  const response = await fetch(GRAPH_SERVER_URL, {
    method: 'POST',
    body: JSON.stringify({ query }),
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  });
  return await response.json();
}

async function runTest(testName: string) {
  console.log(`Running test: ${testName}`);
  const query = fs.readFileSync(`${__dirname}/${testName}.graphql`).toString('utf-8');
  const expected = JSON.parse(fs.readFileSync(`${__dirname}/${testName}.expected.json`).toString('utf-8'));
  const actual = await runQuery(query);
  if (stringify(expected) === stringify(actual)) {
    console.log('OK');
    return true;
  } else {
    const diff = Diff.diffJson(expected, actual);
    for (const part of diff) {
      if (part.removed) {
        console.log(`Expected: ${part.value.trim()}`)
      }
      if (part.added) {
        console.log(`Actual:   ${part.value.trim()}`)
      }
    }
    return false;
  }
}

async function main() {
  const files = fs.readdirSync('.');
  for (const file of files) {
    if (file.match(/\.graphql$/)) {
      await runTest(file.split('.').slice(0, -1).join('.'));
    }
  }
}

main().then(() => console.log('done')).catch((err) => console.error(err));
