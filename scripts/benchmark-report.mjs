import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { digest, summarizeBenchmark } from './benchmark-metrics.mjs';
import { benchmarkCases, benchmarkModels, benchmarkRoutes } from './benchmark-cases.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.argv.length !== 3)
  throw new Error('Usage: node scripts/benchmark-report.mjs PRIVATE_REPORT');
let report = JSON.parse(await readFile(process.argv[2], 'utf8'));
if (
  !['xerify-cross-provider-v2', 'xerify-cross-provider-v3'].includes(report.suite) ||
  report.sourceMode !== 'declared-fixture-identity-only' ||
  report.caseDigest !== digest(report.scenarios) ||
  report.caseDigest !== digest(benchmarkCases) ||
  digest(report.routes) !== digest(benchmarkRoutes(report.models)) ||
  !Number.isInteger(report.repeats) ||
  report.repeats < 1 ||
  report.repeats > 3 ||
  report.limits?.timeoutMs !== 0
)
  throw new Error('Invalid benchmark report');
const keys = new Set();
for (const row of report.records) {
  const key = `${row.route}/${row.scenario}/${row.repeat}`;
  const scenario = report.scenarios.find((s) => s.id === row.scenario);
  if (
    keys.has(key) ||
    !scenario ||
    !report.routes.some((r) => r.id === row.route) ||
    row.repeat < 1 ||
    row.repeat > report.repeats ||
    row.expected !== scenario.expected ||
    row.evidenceDigest !== digest({ claim: scenario.claim, context: scenario.context })
  )
    throw new Error('Invalid or duplicate cell');
  keys.add(key);
}
if (keys.size !== report.routes.length * report.scenarios.length * report.repeats)
  throw new Error('Matrix is incomplete; do not publish partial measurements as final');
const originalCalls = report.records.length;
const selectedModels = Object.fromEntries(
  Object.entries(report.models).filter(([p]) => Object.hasOwn(benchmarkModels, p))
);
const selectedRoutes = benchmarkRoutes(selectedModels);
const selectedIds = new Set(selectedRoutes.map((r) => r.id));
report = {
  ...report,
  models: selectedModels,
  routes: selectedRoutes,
  records: report.records.filter((r) => selectedIds.has(r.route))
};
const selection = {
  providers: Object.keys(selectedModels),
  originalCalls,
  selectedCalls: report.records.length,
  excludedProvider: originalCalls === report.records.length ? null : 'cursor',
  reason:
    'Owner-selected three-provider comparison; Cursor integration investigated separately. Historical measurements are not rerun.'
};
const summary = summarizeBenchmark(report.records, report.routes, report.scenarios, report.repeats);
// This public statistical artifact intentionally excludes prompts, raw output, free-text summaries,
// private filesystem paths, per-run identifiers, auth details and provider response objects.
const artifact = {
  suite: report.suite,
  startedAt: report.startedAt,
  sourceMode: report.sourceMode,
  caseDigest: report.caseDigest,
  models: report.models,
  limits: report.limits,
  repeats: report.repeats,
  runtime: report.runtime,
  implementationDigests: report.implementationDigests,
  selection,
  summary,
  observations: report.records.map((r) => ({
    route: r.route,
    scenario: r.scenario,
    repeat: r.repeat,
    expected: r.expected,
    status: r.status,
    verdict: r.verdict,
    failureCode: r.failureCode,
    wallMs: r.wallMs ?? null,
    inputTokens: r.usage?.inputTokens ?? null,
    outputTokens: r.usage?.outputTokens ?? null,
    costUsd: r.usage?.costUsd ?? null,
    jevChoice: r.decision?.choice ?? null,
    jevSelectedProbability: r.decision?.probabilities?.[r.decision?.choice] ?? null,
    jevConfidence: r.decision?.confidence ?? null,
    reportedModel: r.decision?.model ?? null
  }))
};
const directory = path.join(root, 'docs/benchmarks');
await mkdir(directory, { recursive: true });
const filename = `${report.startedAt.slice(0, 10)}-${report.suite.endsWith('v2') ? 'v2' : 'v3'}-three-providers`;
await writeFile(path.join(directory, `${filename}.json`), `${JSON.stringify(artifact, null, 2)}\n`);
const number = (v) => (v === null ? '—' : String(v));
const tokens = (v, n) => `${number(v.total)} (${v.reported}/${n})`;
let markdown = `# Cross-provider results: ${report.startedAt.slice(0, 10)}\n\nSuite: \`${report.suite}\`. Method and limitations: [benchmark guide](../benchmark.md).\nMachine-readable derived measurements: [JSON](${filename}.json). No raw provider responses are published. Selection: ${selection.selectedCalls}/${selection.originalCalls} historical measurements; Cursor routes excluded by owner request, not rerun.\n\n`;
markdown +=
  '| Route | Match / attempted | Skipped | Valid | Failure | Context match / attempted | False confirmed | Extra unclear | Valid p50 / p95 ms | Input tokens (coverage) | Output tokens (coverage) | USD (coverage) |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n';
for (const s of summary)
  markdown += `| ${s.route} | ${s.correct}/${s.attempted} | ${s.skipped} | ${s.valid} | ${s.failures} | ${s.contextCorrect}/${s.contextAttempted} | ${s.falseConfirmations} | ${s.unnecessaryAbstentions} | ${number(s.latencyMs.p50)} / ${number(s.latencyMs.p95)} | ${tokens(s.inputTokens, s.attempted)} | ${tokens(s.outputTokens, s.attempted)} | ${tokens(s.costUsd, s.attempted)} |\n`;
markdown +=
  '\nOperational failures count against delivery success, including when their fallback verdict is unclear. Valid-latency percentiles exclude failed calls; see JSON for their separate durations. Missing token/cost observations are unknown, not zero. No dollar comparison is valid where coverage is absent.\n\n## Scenario matrix\n\n';
markdown += `| Scenario | Expected | ${report.routes.map((r) => r.id).join(' | ')} |\n| --- | --- | ${report.routes.map(() => '---').join(' | ')} |\n`;
for (const scenario of report.scenarios) {
  markdown += `| ${scenario.id} | ${scenario.expected} | ${report.routes
    .map((route) =>
      report.records
        .filter((r) => r.route === route.id && r.scenario === scenario.id)
        .map((r) => (r.status === 'skipped' ? 'skipped' : (r.failureCode ?? r.verdict)))
        .join(', ')
    )
    .join(' | ')} |\n`;
}
markdown +=
  '\nThese are authored synthetic-label comparisons, not a production accuracy estimate. A schema error measures contract delivery failure; it does not reveal the correctness of an unparseable answer. Repeated target calls under different declared source identities share identical model-visible inputs. Review individual mismatches before drawing conclusions.\n';
await writeFile(path.join(directory, `${filename}.md`), markdown);
const localized = {
  tr: {
    title: 'Sağlayıcılar arası sonuçlar',
    method: 'Yöntem ve sınırlamalar',
    data: 'Türetilmiş ölçümler',
    privacy:
      'Ham sağlayıcı yanıtları yayımlanmaz. Sahibinin seçtiği üç sağlayıcı alt kümesi: geçmiş {original} ölçümden {selected}; Cursor yönleri çıkarıldı, yeniden çağrı yapılmadı.',
    headers:
      'Yön | Eşleşme / çağrı | Atlanan | Geçerli | Hata | Bağlam eşleşmesi / çağrı | Yanlış confirmed | Fazladan unclear | Geçerli p50 / p95 ms | Giriş token (kapsama) | Çıkış token (kapsama) | USD (kapsama)',
    note: 'Teknik hatalar, sonuçları unclear olsa bile teslim başarısını düşürür. Geçerli gecikme yüzdelikleri hatalı çağrıları dışlar; ayrı süreleri JSON içindedir. Eksik token/maliyet bilinmiyor demektir, sıfır değil. Raporlama kapsamı yoksa dolar karşılaştırması yapılamaz.',
    matrix: 'Senaryo matrisi',
    scenario: 'Senaryo',
    expected: 'Beklenen',
    end: 'Bunlar sentetik etiketlerle karşılaştırmadır, üretim doğruluğu tahmini değildir. Şema hatası kullanılabilir sonuç teslim edilemediğini gösterir; çözümlenemeyen cevabın doğruluğunu göstermez. Farklı beyan edilmiş kaynak kimlikleriyle aynı hedefe yapılan çağrılar aynı model girdisini kullanır. Sonuç çıkarmadan önce uyumsuzlukları inceleyin.'
  },
  de: {
    title: 'Anbieterübergreifende Ergebnisse',
    method: 'Methode und Grenzen',
    data: 'Abgeleitete Messungen',
    privacy:
      'Keine rohen Anbieterantworten. Vom Eigentümer gewählte Teilmenge: {selected} von {original} historischen Messungen; Cursor-Routen ausgeschlossen, kein neuer Lauf.',
    headers:
      'Route | Treffer / Versuche | Übersprungen | Gültig | Fehler | Kontexttreffer / Versuche | Falsches confirmed | Zusätzliches unclear | Gültige p50 / p95 ms | Eingabetokens (Abdeckung) | Ausgabetokens (Abdeckung) | USD (Abdeckung)',
    note: 'Betriebsfehler mindern den Lieferungserfolg, auch wenn ihr Ersatzurteil unclear lautet. Gültige Latenzperzentile schließen Fehler aus; separate Zeiten stehen im JSON. Fehlende Token-/Kostenwerte sind unbekannt, nicht null. Ohne Kostenabdeckung ist kein Dollarvergleich möglich.',
    matrix: 'Szenariomatrix',
    scenario: 'Szenario',
    expected: 'Erwartet',
    end: 'Vergleich mit synthetischen Labels, keine Schätzung der Produktionsgenauigkeit. Schemafehler messen fehlgeschlagene Vertragserfüllung, nicht die Richtigkeit einer unlesbaren Antwort. Gleiche Ziele unter verschiedenen deklarierten Quellen erhalten identische Eingaben. Abweichungen vor Schlussfolgerungen prüfen.'
  },
  fr: {
    title: 'Résultats entre fournisseurs',
    method: 'Méthode et limites',
    data: 'Mesures dérivées',
    privacy:
      'Aucune réponse brute publiée. Sous-ensemble choisi par le propriétaire : {selected} des {original} mesures historiques ; routes Cursor exclues, sans nouvel appel.',
    headers:
      'Direction | Accords / tentatives | Sautés | Valides | Erreurs | Contexte / tentatives | Faux confirmed | unclear en trop | p50 / p95 valides ms | Tokens entrée (couverture) | Tokens sortie (couverture) | USD (couverture)',
    note: 'Les erreurs opérationnelles réduisent le succès de livraison, même si leur verdict est unclear. Les percentiles valides excluent les échecs ; leurs temps séparés sont dans le JSON. Usage/coût absent signifie inconnu, pas zéro. Aucun comparatif en dollars sans couverture.',
    matrix: 'Matrice des scénarios',
    scenario: 'Scénario',
    expected: 'Attendu',
    end: 'Comparaison à des labels synthétiques, pas estimation de précision en production. Une erreur de schéma mesure un échec de contrat, pas la justesse d’une réponse illisible. Les mêmes cibles sous différentes sources déclarées reçoivent les mêmes entrées. Examiner les divergences avant de conclure.'
  },
  es: {
    title: 'Resultados entre proveedores',
    method: 'Método y limitaciones',
    data: 'Mediciones derivadas',
    privacy:
      'Sin respuestas brutas. Subconjunto elegido por el propietario: {selected} de {original} mediciones históricas; rutas Cursor excluidas, sin nuevas llamadas.',
    headers:
      'Ruta | Coincidencias / intentos | Omitidas | Válidas | Fallos | Contexto / intentos | confirmed falsos | unclear extra | p50 / p95 válidos ms | Tokens entrada (cobertura) | Tokens salida (cobertura) | USD (cobertura)',
    note: 'Los fallos operativos penalizan la entrega aunque su veredicto sea unclear. Los percentiles válidos excluyen fallos; sus tiempos separados están en JSON. Uso/coste ausente significa desconocido, no cero. Sin cobertura no es válido comparar dólares.',
    matrix: 'Matriz de escenarios',
    scenario: 'Escenario',
    expected: 'Esperado',
    end: 'Comparación con etiquetas sintéticas, no estimación de precisión en producción. Un error de esquema mide fallo de contrato, no la corrección de una respuesta no interpretable. Los mismos destinos con distintas fuentes declaradas reciben entradas idénticas. Revisar discrepancias antes de concluir.'
  },
  'zh-CN': {
    title: '跨提供方结果',
    method: '方法与限制',
    data: '派生测量',
    privacy:
      '不发布原始响应。按所有者要求选择三提供方子集：历史 {original} 次测量中的 {selected} 次；排除 Cursor 方向，未重新调用。',
    headers:
      '方向 | 匹配 / 尝试 | 跳过 | 有效 | 失败 | 上下文匹配 / 尝试 | 错误 confirmed | 多余 unclear | 有效 p50 / p95 ms | 输入 token（覆盖） | 输出 token（覆盖） | USD（覆盖）',
    note: '操作故障即使返回 unclear 也降低交付成功率。有效延迟分位数排除失败调用；失败耗时在 JSON 单独列出。缺失用量或费用表示未知，不是零。无报告覆盖时不能比较美元成本。',
    matrix: '场景矩阵',
    scenario: '场景',
    expected: '预期',
    end: '这是与合成标签的比较，不是生产准确率估计。Schema 错误衡量契约交付失败，不能说明无法解析答案是否正确。不同声明来源下对同一目标的重复调用使用相同模型输入。下结论前应检查不符项。'
  }
};
const tables = markdown.match(/\| Route[\s\S]*?(?=\n\n)|\| Scenario[\s\S]*?(?=\n\n)/g);
if (tables?.length !== 2) throw new Error('Expected both result tables');
for (const [language, copy] of Object.entries(localized)) {
  const localDirectory = path.join(root, 'docs/i18n', language, 'benchmarks');
  await mkdir(localDirectory, { recursive: true });
  const mainTable = tables[0].replace(/^.*\n/, `| ${copy.headers} |\n`);
  const scenarioTable = tables[1].replace(
    '| Scenario | Expected |',
    `| ${copy.scenario} | ${copy.expected} |`
  );
  await writeFile(
    path.join(localDirectory, `${filename}.md`),
    `# ${copy.title}: ${report.startedAt.slice(0, 10)}\n\n\`${report.suite}\` · [${copy.method}](../benchmark.md) · [${copy.data}](../../../benchmarks/${filename}.json)\n\n${copy.privacy.replace('{original}', String(selection.originalCalls)).replace('{selected}', String(selection.selectedCalls))}\n\n${mainTable}\n\n${copy.note}\n\n## ${copy.matrix}\n\n${scenarioTable}\n\n${copy.end}\n`
  );
}
process.stdout.write(`Wrote docs/benchmarks/${filename}.{json,md}\n`);
