export type ScoreColumnInputMode = 'number' | 'evaluation';

export type TraitFieldKey = 'morality' | 'punctuality' | 'hygiene';

export const EVALUATION_GRADE_OPTIONS = [
  'ល្អណាស់',
  'ល្អ',
  'មធ្យម',
  'ខ្សោយ',
] as const;

export type EvaluationGradeValue = (typeof EVALUATION_GRADE_OPTIONS)[number];

export interface TraitColumnDef {
  key: TraitFieldKey;
  labelKh: string;
  labelEn: string;
}

export const TRAIT_EVALUATION_COLUMNS: TraitColumnDef[] = [
  { key: 'morality', labelKh: 'សីលធម៌រស់នៅ', labelEn: 'Morality' },
  { key: 'punctuality', labelKh: 'ឧស្សាហ៍ព្យាយាម', labelEn: 'Punctuality' },
  { key: 'hygiene', labelKh: 'សុខភាពអនាម័យ', labelEn: 'Hygiene' },
];

export interface PresetSubjectColumnDef {
  key: string;
  label: string;
  defaultEnabled: boolean;
}

/** 3 core exam columns that cannot be removed and are always placed at the far right of subject columns */
export const LOCKED_SUBJECT_COLUMNS: Array<{ key: string; label: string }> = [
  { key: 'quiz', label: 'Quiz' },
  { key: 'exercise', label: 'Exercise' },
  { key: 'test', label: 'Test' },
];

export const LOCKED_SUBJECT_KEY_SET = new Set<string>(
  LOCKED_SUBJECT_COLUMNS.map((c) => c.key)
);

/** Optional subject columns shown in the Checkbox dropdown (Homework, Reading, Dictation, Presentation enabled by default) */
export const OPTIONAL_PRESET_SUBJECT_COLUMNS: PresetSubjectColumnDef[] = [
  { key: 'homework', label: 'Homework', defaultEnabled: true },
  { key: 'reading', label: 'Reading', defaultEnabled: true },
  { key: 'dictation', label: 'Dictation', defaultEnabled: true },
  { key: 'presentation', label: 'Presentation', defaultEnabled: true },
  { key: 'writing', label: 'Writing', defaultEnabled: false },
  { key: 'speaking', label: 'Speaking', defaultEnabled: false },
  { key: 'listening', label: 'Listening', defaultEnabled: false },
  { key: 'spelling', label: 'Spelling', defaultEnabled: false },
];

export const PRESET_SUBJECT_COLUMNS: PresetSubjectColumnDef[] = [
  ...OPTIONAL_PRESET_SUBJECT_COLUMNS,
  ...LOCKED_SUBJECT_COLUMNS.map((c) => ({ ...c, defaultEnabled: true })),
];

export const DEFAULT_ENABLED_SUBJECT_KEYS: string[] = OPTIONAL_PRESET_SUBJECT_COLUMNS
  .filter((c) => c.defaultEnabled)
  .map((c) => c.key);

export interface CustomScoreColumnDef {
  key: string;
  label: string;
}

export interface ClassScoreColumnsConfig {
  enabledKeys: string[];
  columnModes: Record<string, ScoreColumnInputMode>;
  customColumns: CustomScoreColumnDef[];
}

export interface ActiveScoreSubjectColumn {
  key: string;
  label: string;
  inputMode: ScoreColumnInputMode;
  isCustom: boolean;
  isLocked: boolean;
}

const EVAL_SET = new Set<string>(EVALUATION_GRADE_OPTIONS);

export function isEvaluationGradeValue(val: unknown): val is EvaluationGradeValue {
  return typeof val === 'string' && EVAL_SET.has(val.trim());
}

export function normalizeEvaluationValue(raw: unknown): EvaluationGradeValue | '' {
  const clean = String(raw ?? '').trim();
  if (!clean) return '';
  if (EVAL_SET.has(clean)) return clean as EvaluationGradeValue;
  const lower = clean.toLowerCase();
  if (lower.includes('excellent') || clean.includes('ល្អណាស់') || clean.includes('ល្អប្រសើរ')) {
    return 'ល្អណាស់';
  }
  if (lower === 'good' || lower.includes('good') || clean.startsWith('ល្អ')) {
    return 'ល្អ';
  }
  if (lower.includes('fair') || lower.includes('medium') || clean.includes('មធ្យម')) {
    return 'មធ្យម';
  }
  if (lower.includes('poor') || lower.includes('weak') || clean.includes('ខ្សោយ')) {
    return 'ខ្សោយ';
  }
  return '';
}

export function getEvaluationVisualStyle(val: string): {
  color: string;
  background: string;
  borderColor: string;
} {
  switch (val) {
    case 'ល្អណាស់':
      return {
        color: '#047857',
        background: 'rgba(16, 185, 129, 0.13)',
        borderColor: 'rgba(16, 185, 129, 0.38)',
      };
    case 'ល្អ':
      return {
        color: '#1d4ed8',
        background: 'rgba(59, 130, 246, 0.12)',
        borderColor: 'rgba(59, 130, 246, 0.36)',
      };
    case 'មធ្យម':
      return {
        color: '#b45309',
        background: 'rgba(245, 158, 11, 0.14)',
        borderColor: 'rgba(245, 158, 11, 0.4)',
      };
    case 'ខ្សោយ':
      return {
        color: '#b91c1c',
        background: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.36)',
      };
    default:
      return {
        color: 'var(--text-secondary)',
        background: 'var(--main-bg)',
        borderColor: 'var(--border-color)',
      };
  }
}

function toSafeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === 'object') {
    return Object.values(raw as Record<string, T>);
  }
  return [];
}

export function sanitizeColumnsConfig(raw: any): ClassScoreColumnsConfig | null {
  if (!raw || typeof raw !== 'object') return null;

  const rawEnabled = toSafeArray<unknown>(raw.enabledKeys)
    .map((k) => String(k ?? '').trim())
    .filter(Boolean);

  const rawCustom = toSafeArray<any>(raw.customColumns)
    .filter((c) => c && typeof c === 'object')
    .map((c) => ({
      key: String(c.key ?? '').trim(),
      label: String(c.label ?? '').trim(),
    }))
    .filter((c) => c.key && c.label);

  const uniqueCustomMap = new Map<string, CustomScoreColumnDef>();
  const reservedKeySet = new Set<string>([
    ...OPTIONAL_PRESET_SUBJECT_COLUMNS.map((p) => p.key),
    ...LOCKED_SUBJECT_COLUMNS.map((c) => c.key),
  ]);
  rawCustom.forEach((c) => {
    if (!reservedKeySet.has(c.key) && !uniqueCustomMap.has(c.key)) {
      uniqueCustomMap.set(c.key, c);
    }
  });
  const customColumns = Array.from(uniqueCustomMap.values());

  const validCheckboxKeySet = new Set<string>([
    ...OPTIONAL_PRESET_SUBJECT_COLUMNS.map((p) => p.key),
    ...customColumns.map((c) => c.key),
  ]);

  const validAllKeySet = new Set<string>([
    ...validCheckboxKeySet,
    ...LOCKED_SUBJECT_COLUMNS.map((c) => c.key),
  ]);

  const seenEnabled = new Set<string>();
  const enabledKeys: string[] = [];
  rawEnabled.forEach((k) => {
    if (
      validCheckboxKeySet.has(k) &&
      !LOCKED_SUBJECT_KEY_SET.has(k) &&
      !seenEnabled.has(k)
    ) {
      seenEnabled.add(k);
      enabledKeys.push(k);
    }
  });

  const columnModes: Record<string, ScoreColumnInputMode> = {};
  if (raw.columnModes && typeof raw.columnModes === 'object') {
    Object.entries(raw.columnModes).forEach(([k, v]) => {
      if (validAllKeySet.has(k) && (v === 'number' || v === 'evaluation')) {
        columnModes[k] = v;
      }
    });
  }

  return {
    enabledKeys:
      raw.hasExplicitEmptyEnabled === true
        ? enabledKeys
        : enabledKeys.length > 0
          ? enabledKeys
          : [...DEFAULT_ENABLED_SUBJECT_KEYS],
    columnModes,
    customColumns,
  };
}

export function getDefaultClassColumnsConfig(): ClassScoreColumnsConfig {
  return {
    enabledKeys: [...DEFAULT_ENABLED_SUBJECT_KEYS],
    columnModes: {},
    customColumns: [],
  };
}

/** Resolves column settings strictly for the given class + month snapshot (no cross-month leaking) */
export function resolveClassColumnsConfig(monthClassEntry: any): ClassScoreColumnsConfig {
  const fromMonth = sanitizeColumnsConfig(monthClassEntry?.columnsConfig);
  if (fromMonth) return fromMonth;
  return getDefaultClassColumnsConfig();
}

/** Toggleable columns displayed in the Checkbox dropdown (excludes locked Quiz, Exercise, Test) */
export function getCheckboxSubjectColumns(
  cfg: ClassScoreColumnsConfig
): ActiveScoreSubjectColumn[] {
  const optionalPresets: ActiveScoreSubjectColumn[] = OPTIONAL_PRESET_SUBJECT_COLUMNS.map((p) => ({
    key: p.key,
    label: p.label,
    inputMode: cfg.columnModes[p.key] === 'evaluation' ? 'evaluation' : 'number',
    isCustom: false,
    isLocked: false,
  }));
  const customs: ActiveScoreSubjectColumn[] = cfg.customColumns.map((c) => ({
    key: c.key,
    label: c.label,
    inputMode: cfg.columnModes[c.key] === 'evaluation' ? 'evaluation' : 'number',
    isCustom: true,
    isLocked: false,
  }));
  return [...optionalPresets, ...customs];
}

export function getLockedSubjectColumns(
  cfg: ClassScoreColumnsConfig
): ActiveScoreSubjectColumn[] {
  return LOCKED_SUBJECT_COLUMNS.map((c) => ({
    key: c.key,
    label: c.label,
    inputMode: cfg.columnModes[c.key] === 'evaluation' ? 'evaluation' : 'number',
    isCustom: false,
    isLocked: true,
  }));
}

export function getAllAvailableSubjectColumns(
  cfg: ClassScoreColumnsConfig
): ActiveScoreSubjectColumn[] {
  return [...getCheckboxSubjectColumns(cfg), ...getLockedSubjectColumns(cfg)];
}

/** Active columns rendered in the score table: enabled optional + custom columns first, then locked Quiz, Exercise, Test at far right */
export function getActiveSubjectColumns(
  cfg: ClassScoreColumnsConfig
): ActiveScoreSubjectColumn[] {
  const enabledSet = new Set(cfg.enabledKeys);
  const activeOptionalAndCustom = getCheckboxSubjectColumns(cfg).filter((c) =>
    enabledSet.has(c.key)
  );
  return [...activeOptionalAndCustom, ...getLockedSubjectColumns(cfg)];
}

export function makeCustomColumnKey(label: string, existingKeys: string[]): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 18);
  const existing = new Set(existingKeys);
  const base = slug ? `custom_${slug}` : `custom_col`;
  if (!existing.has(base)) return base;
  let suffix = 2;
  while (existing.has(`${base}_${suffix}`)) {
    suffix += 1;
  }
  return `${base}_${suffix}`;
}

export function getColumnEvalValue(scoreRec: any, colKey: string): string {
  const fromMap = normalizeEvaluationValue(scoreRec?.evalValues?.[colKey]);
  if (fromMap) return fromMap;
  const fromDirect = normalizeEvaluationValue(scoreRec?.[colKey]);
  return fromDirect;
}

export function getColumnNumericValue(scoreRec: any, colKey: string): string {
  const raw = scoreRec?.[colKey];
  if (raw === undefined || raw === null) return '';
  const str = String(raw);
  if (normalizeEvaluationValue(str)) return '';
  return str;
}

export function computeNumericTotalForColumns(
  scoreRec: any,
  activeColumns: ActiveScoreSubjectColumn[]
): { totalScore: string; hasNumericValue: boolean } {
  let total = 0;
  let hasNumericValue = false;
  for (const col of activeColumns) {
    if (col.inputMode !== 'number') continue;
    const raw = getColumnNumericValue(scoreRec, col.key).trim();
    if (!raw) continue;
    const num = parseFloat(raw);
    if (!Number.isNaN(num) && Number.isFinite(num)) {
      total += num;
      hasNumericValue = true;
    }
  }
  if (!hasNumericValue) {
    return { totalScore: '', hasNumericValue: false };
  }
  const rounded = Math.round(total * 1000) / 1000;
  return { totalScore: String(rounded), hasNumericValue: true };
}

export function isStandardYearMonth(monthStr: string): boolean {
  return /^\d{4}-\d{2}$/.test(String(monthStr || '').trim());
}

export function shiftYearMonth(monthStr: string, deltaMonths: number): string | null {
  if (!isStandardYearMonth(monthStr)) return null;
  const [yStr, mStr] = monthStr.split('-');
  const y = parseInt(yStr, 10);
  const m = parseInt(mStr, 10);
  if (Number.isNaN(y) || Number.isNaN(m)) return null;
  const dt = new Date(y, m - 1 + deltaMonths, 1);
  const nextY = dt.getFullYear();
  const nextM = String(dt.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
}

export function getPreviousMonthCandidates(monthStr: string, maxLookback = 6): string[] {
  if (!isStandardYearMonth(monthStr)) return [];
  const list: string[] = [];
  for (let i = 1; i <= maxLookback; i++) {
    const prev = shiftYearMonth(monthStr, -i);
    if (prev) list.push(prev);
  }
  return list;
}

export function normalizeLookupKey(val: unknown): string {
  return String(val ?? '').trim().toLowerCase();
}

export type StudentTraitSnapshot = Partial<Record<TraitFieldKey, string>>;

export function buildStudentTraitLookup(
  classMonthScores: any[]
): { byStudentId: Map<string, StudentTraitSnapshot>; byStudentCode: Map<string, StudentTraitSnapshot> } {
  const byStudentId = new Map<string, StudentTraitSnapshot>();
  const byStudentCode = new Map<string, StudentTraitSnapshot>();

  for (const row of classMonthScores) {
    const snap: StudentTraitSnapshot = {};
    for (const col of TRAIT_EVALUATION_COLUMNS) {
      const norm = normalizeEvaluationValue(row?.[col.key]);
      if (norm) snap[col.key] = norm;
    }
    if (Object.keys(snap).length === 0) continue;

    const sid = normalizeLookupKey(row?.studentId);
    const code = normalizeLookupKey(row?.studentIdCode);
    if (sid) byStudentId.set(sid, snap);
    if (code) byStudentCode.set(code, snap);
  }

  return { byStudentId, byStudentCode };
}

export function findStudentTraitSnapshot(
  lookup: { byStudentId: Map<string, StudentTraitSnapshot>; byStudentCode: Map<string, StudentTraitSnapshot> },
  studentId?: unknown,
  studentIdCode?: unknown
): StudentTraitSnapshot | null {
  const sid = normalizeLookupKey(studentId);
  const code = normalizeLookupKey(studentIdCode);
  if (sid && lookup.byStudentId.has(sid)) return lookup.byStudentId.get(sid) || null;
  if (code && lookup.byStudentCode.has(code)) return lookup.byStudentCode.get(code) || null;
  if (sid && lookup.byStudentCode.has(sid)) return lookup.byStudentCode.get(sid) || null;
  if (code && lookup.byStudentId.has(code)) return lookup.byStudentId.get(code) || null;
  return null;
}
