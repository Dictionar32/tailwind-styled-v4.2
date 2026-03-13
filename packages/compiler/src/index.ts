// ── Core transform pipeline ──────────────────────────────────────────────────

export type { TransformOptions, TransformResult } from "./astTransform"
export { shouldProcess, transformSource } from "./astTransform"
export type { AtomicRule } from "./atomicCss"
// ── Atomic CSS ────────────────────────────────────────────────────────────────
export {
  clearAtomicRegistry,
  generateAtomicCss,
  getAtomicRegistry,
  parseAtomicClass,
  toAtomicClasses,
} from "./atomicCss"
// ── Class utilities ───────────────────────────────────────────────────────────
export { extractAllClasses } from "./classExtractor"
export { mergeClassesStatic, normalizeClasses } from "./classMerger"
export type { HoistResult } from "./componentHoister"
// ── Component hoisting ────────────────────────────────────────────────────────
export { hoistComponents } from "./componentHoister"
export type {
  EliminationReport,
  VariantUsage,
} from "./deadStyleEliminator"
// ── Dead Style Eliminator ─────────────────────────────────────────────────────
export {
  extractComponentUsage,
  runElimination,
  scanProjectUsage,
} from "./deadStyleEliminator"
export type {
  CssDiff,
  FileDependencyGraph,
  IncrementalEngineOptions,
  IncrementalStats,
  ProcessResult,
  StyleNode,
} from "./incrementalEngine"
// ── Incremental CSS Compiler ──────────────────────────────────────────────────
export {
  getIncrementalEngine,
  IncrementalEngine,
  parseClassesToNodes,
  resetIncrementalEngine,
} from "./incrementalEngine"
// ── Zero-config Tailwind config loader ───────────────────────────────────────
export {
  bootstrapZeroConfig,
  getContentPaths,
  invalidateConfigCache,
  isZeroConfig,
  loadTailwindConfig,
} from "./loadTailwindConfig"
export type { RouteClassMap } from "./routeCssCollector"
// ── Route CSS collector ────────────────────────────────────────────────────────
export {
  fileToRoute,
  getAllRoutes,
  getCollector,
  getCollectorSummary,
  getRouteClasses,
  registerFileClasses,
  registerGlobalClasses,
  resetCollector,
} from "./routeCssCollector"
export type { ComponentEnv, RscAnalysis, StaticVariantUsage } from "./rscAnalyzer"
// ── RSC-Aware ─────────────────────────────────────────────────────────────────
export {
  analyzeFile,
  analyzeVariantUsage,
  injectClientDirective,
  injectServerOnlyComment,
  resolveServerVariant,
} from "./rscAnalyzer"
// ── Safelist ──────────────────────────────────────────────────────────────────
export { generateSafelist, generateSafelistCss, loadSafelist } from "./safelistGenerator"
export type {
  BucketStats,
  ConflictWarning,
  StyleBucket,
} from "./styleBucketSystem"
// ── Style Bucket System ───────────────────────────────────────────────────────
export {
  BucketEngine,
  bucketSort,
  classifyNode,
  detectConflicts,
  getBucketEngine,
  resetBucketEngine,
} from "./styleBucketSystem"
export type { CssGenerateResult, TailwindEngineOptions } from "./tailwindEngine"
// ── Embedded Tailwind engine ──────────────────────────────────────────────────
export { generateAllRouteCss, generateCssForClasses } from "./tailwindEngine"
// ── Detectors ─────────────────────────────────────────────────────────────────
export {
  hasInteractiveFeatures,
  hasTwUsage,
  isDynamic,
  isServerComponent,
} from "./twDetector"
export { compileVariants } from "./variantCompiler"
