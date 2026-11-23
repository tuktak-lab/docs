// 문서 저장소 검사: 필수 파일, 상대 링크, 표 열 수, 요구사항 ID, YAML 형식.
// 사용: node scripts/check-docs.mjs   (Node 18+, YAML 검사에는 `yaml` 패키지 필요 — 없으면 건너뜀)
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rel = (p) => relative(root, p).replaceAll('\\', '/');
const errors = [];
const fail = (file, line, msg) => errors.push(`${rel(file)}${line ? `:${line}` : ''}  ${msg}`);

const REQUIRED = [
  'README.md', 'CLAUDE.md', '결정체크리스트.md', '요구사항명세서.md', '기획서.md',
  'docs/ARCHITECTURE.md', 'docs/CONTRACTS.md', 'docs/DEVELOPMENT.md',
  '.claude/agents/doc-editor.md',
];
for (const f of REQUIRED) if (!existsSync(join(root, f))) fail(join(root, f), 0, '필수 파일 없음');

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}
const files = walk(root);
const mdFiles = files.filter((f) => f.endsWith('.md'));

// 명세서 표 첫 칸에 정의된 ID
const specPath = join(root, '요구사항명세서.md');
const definedIds = new Set(
  [...readFileSync(specPath, 'utf8').matchAll(/^\|\s*((?:FR-[A-Z0-9]+|NFR)-\d+)\s*\|/gm)].map((m) => m[1]),
);
const ID_RE = /\b(?:FR-[A-Z][A-Z0-9]*|NFR)-\d+\b/g;

for (const file of mdFiles) {
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  const isRecord = rel(file).startsWith('docs/reviews/'); // 작성 시점 기록: 옛 ID가 남아도 됨
  let fence = null; // 열린 코드 블록의 표시 (``` 또는 ```` 등)
  let tableCols = null;
  lines.forEach((line, i) => {
    const n = i + 1;
    const marker = line.match(/^\s*(`{3,}|~{3,})/)?.[1];
    if (marker && !fence) { fence = marker; tableCols = null; return; }
    if (marker && fence && marker[0] === fence[0] && marker.length >= fence.length && line.trim() === marker) { fence = null; return; }
    if (fence) return;
    const text = line.replace(/`[^`]*`/g, '``'); // 인라인 코드 안은 검사하지 않음

    // 상대 링크: 대상 파일·폴더가 있어야 함 (앵커는 검사하지 않음)
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      if (/^(https?:|mailto:|#)/.test(target)) continue;
      const path = decodeURIComponent(target.split('#')[0]);
      if (path && !existsSync(resolve(dirname(file), path))) fail(file, n, `깨진 링크: ${target}`);
    }

    // 표: 같은 표 안의 행은 열 수가 같아야 함
    if (/^\s*\|/.test(text)) {
      const cols = text.replace(/\\\|/g, '').trim().replace(/^\||\|$/g, '').split('|').length;
      if (tableCols === null) tableCols = cols;
      else if (cols !== tableCols) fail(file, n, `표 열 수 ${cols} (첫 행 ${tableCols})`);
    } else tableCols = null;

    // 요구사항 ID: 명세서에 정의된 것만
    if (!isRecord && file !== specPath) {
      for (const [id] of text.matchAll(ID_RE)) if (!definedIds.has(id)) fail(file, n, `명세서에 없는 요구사항 ID: ${id}`);
    }
  });
}

// YAML 형식
const yamlFiles = files.filter((f) => /\.ya?ml$/.test(f));
let yaml = null;
try { yaml = createRequire(join(root, 'package.json'))('yaml'); } catch { /* 없으면 건너뜀 */ }
if (yaml) {
  for (const f of yamlFiles) {
    try { yaml.parse(readFileSync(f, 'utf8')); } catch (e) { fail(f, e.linePos?.[0]?.line, `YAML 오류: ${e.message.split('\n')[0]}`); }
  }
} else {
  console.log(`(yaml 패키지가 없어 YAML ${yamlFiles.length}개 검사를 건너뜀)`);
}

console.log(`검사: md ${mdFiles.length}개, yaml ${yaml ? yamlFiles.length : 0}개, 명세서 ID ${definedIds.size}개`);
if (errors.length) {
  console.error(`실패 ${errors.length}건\n` + errors.join('\n'));
  process.exit(1);
}
console.log('통과');
