"use client";

export type CertTextBoxKey =
  | 'nationalMotto'
  | 'titleBlock'
  | 'khmerBody'
  | 'englishBody'
  | 'certNumber'
  | 'classMeta'
  | 'issuedDateBlock'
  | 'principalTitleBlock'
  | 'signatoryName';

export const CERT_TEXTBOX_KEYS: CertTextBoxKey[] = [
  'nationalMotto',
  'titleBlock',
  'khmerBody',
  'englishBody',
  'certNumber',
  'classMeta',
  'issuedDateBlock',
  'principalTitleBlock',
  'signatoryName',
];

export function isCertTextBoxKey(key: string): key is CertTextBoxKey {
  return (CERT_TEXTBOX_KEYS as string[]).includes(key);
}

export interface CertTextBoxStyleConfig {
  /** Word-edited rich HTML template supporting {{dataField}} tokens */
  richHtml?: string;
  /** Per-textbox line height (0.8 - 2.8) */
  lineHeight?: number;
  /** Per-textbox row / paragraph gap in mm (0 - 10) */
  paragraphGapMm?: number;
  /** Per-textbox font family override (supports web fonts & local PC fonts) */
  fontFamily?: string;
  /** Per-textbox base font size in pt (5 - 40) */
  fontSizePt?: number;
  /** Per-textbox default color */
  color?: string;
  /** Per-textbox text alignment */
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  /** Per-textbox letter spacing in px (-1 - 6) */
  letterSpacingPx?: number;
  /** Per-textbox word/space spacing in px (-2 - 24) */
  wordSpacingPx?: number;
  /** Optional custom box width in mm */
  widthMm?: number;
}

export interface CustomCertTextBox {
  id: string;
  label: string;
  dxMm: number;
  dyMm: number;
  scale: number;
  visible: boolean;
  richHtml: string;
  lineHeight: number;
  paragraphGapMm: number;
  fontFamily: string;
  fontSizePt: number;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  letterSpacingPx: number;
  wordSpacingPx?: number;
  widthMm: number;
}

export interface CertificateDataFieldDef {
  key: string;
  token: string;
  labelKh: string;
  group: 'student' | 'score' | 'course' | 'school';
}

export const CERTIFICATE_DATA_FIELD_GROUPS: Record<
  CertificateDataFieldDef['group'],
  string
> = {
  student: 'ព័ត៌មានសិស្ស (Student)',
  score: 'ពិន្ទុ និទ្ទេស & ចំណាត់ថ្នាក់ (Result)',
  course: 'វគ្គសិក្សា ការប្រឡង & កាលបរិច្ឆេទ',
  school: 'សាលា មន្ទីរ & ហត្ថលេខា',
};

export const CERTIFICATE_DATA_FIELDS: CertificateDataFieldDef[] = [
  // Student
  { key: 'studentNameKh', token: '{{studentNameKh}}', labelKh: 'ឈ្មោះសិស្ស (ខ្មែរ)', group: 'student' },
  { key: 'studentNameEn', token: '{{studentNameEn}}', labelKh: 'ឈ្មោះសិស្ស (English)', group: 'student' },
  { key: 'studentNameEnUpper', token: '{{studentNameEnUpper}}', labelKh: 'ឈ្មោះសិស្ស (ENGLISH UPPER)', group: 'student' },
  { key: 'genderKh', token: '{{genderKh}}', labelKh: 'ភេទ (ប្រុស / ស្រី)', group: 'student' },
  { key: 'genderEn', token: '{{genderEn}}', labelKh: 'Gender (Male / Female)', group: 'student' },
  { key: 'dobKh', token: '{{dobKh}}', labelKh: 'ថ្ងៃខែឆ្នាំកំណើត (ខ្មែរ)', group: 'student' },
  { key: 'dobEn', token: '{{dobEn}}', labelKh: 'Date of Birth (English)', group: 'student' },
  { key: 'studentId', token: '{{studentId}}', labelKh: 'អត្តលេខសិស្ស (Student ID)', group: 'student' },
  { key: 'classCode', token: '{{classCode}}', labelKh: 'លេខកូដថ្នាក់ (Class Code)', group: 'student' },
  { key: 'className', token: '{{className}}', labelKh: 'ឈ្មោះថ្នាក់ (Class Name)', group: 'student' },
  { key: 'teacherName', token: '{{teacherName}}', labelKh: 'ឈ្មោះគ្រូបន្ទុកថ្នាក់', group: 'student' },

  // Score & Result
  { key: 'rankKh', token: '{{rankKh}}', labelKh: 'ចំណាត់ថ្នាក់លេខ (ខ្មែរ)', group: 'score' },
  { key: 'rankEn', token: '{{rankEn}}', labelKh: 'Rank Number (English)', group: 'score' },
  { key: 'grade', token: '{{grade}}', labelKh: 'និទ្ទេសអក្សរ (A, B, C...)', group: 'score' },
  { key: 'gradeKh', token: '{{gradeKh}}', labelKh: 'និទ្ទេសពាក្យខ្មែរ (ល្អប្រសើរ, ល្អ...)', group: 'score' },
  { key: 'gradeEn', token: '{{gradeEn}}', labelKh: 'Grade Word (Very Good, Good...)', group: 'score' },
  { key: 'average', token: '{{average}}', labelKh: 'មធ្យមភាគ (Average)', group: 'score' },

  // Course, Exam & Dates
  { key: 'courseKh', token: '{{courseKh}}', labelKh: 'ឈ្មោះវគ្គសិក្សា (ខ្មែរ)', group: 'course' },
  { key: 'courseEn', token: '{{courseEn}}', labelKh: 'Course Name (English)', group: 'course' },
  { key: 'level', token: '{{level}}', labelKh: 'កម្រិត / សៀវភៅ (Level / Book)', group: 'course' },
  { key: 'examKh', token: '{{examKh}}', labelKh: 'ឈ្មោះការប្រឡង (ខ្មែរ)', group: 'course' },
  { key: 'examEn', token: '{{examEn}}', labelKh: 'Exam Name (English)', group: 'course' },
  { key: 'conductedDate', token: '{{conductedDate}}', labelKh: 'ថ្ងៃប្រឡង (Conducted Date)', group: 'course' },
  { key: 'issuedDate', token: '{{issuedDate}}', labelKh: 'ថ្ងៃចុះហត្ថលេខា (Issued Date)', group: 'course' },
  { key: 'certPlaceDate', token: '{{certPlaceDate}}', labelKh: 'ទីកន្លែង & កាលបរិច្ឆេទវិញ្ញាបនបត្រ', group: 'course' },
  { key: 'certNo', token: '{{certNo}}', labelKh: 'លេខរៀងវិញ្ញាបនបត្រ (No.)', group: 'course' },

  // School & Signatory
  { key: 'schoolNameKh', token: '{{schoolNameKh}}', labelKh: 'ឈ្មោះសាលា (ខ្មែរ)', group: 'school' },
  { key: 'schoolNameEn', token: '{{schoolNameEn}}', labelKh: 'School Name (English)', group: 'school' },
  { key: 'provinceKh', token: '{{provinceKh}}', labelKh: 'ខេត្ត / ក្រុង', group: 'school' },
  { key: 'deptKh', token: '{{deptKh}}', labelKh: 'មន្ទីរអប់រំ យុវជន និងកីឡា', group: 'school' },
  { key: 'principalTitle', token: '{{principalTitle}}', labelKh: 'តួនាទីអ្នកចុះហត្ថលេខា', group: 'school' },
  { key: 'signatoryName', token: '{{signatoryName}}', labelKh: 'ឈ្មោះអ្នកចុះហត្ថលេខា', group: 'school' },
];

export interface RichFontChoice {
  label: string;
  value: string;
  group: 'khmer_web' | 'khmer_pc' | 'english_web' | 'english_pc';
}

export const BUILTIN_RICH_FONT_CHOICES: RichFontChoice[] = [
  // Khmer Web Fonts
  { label: 'Moul (អក្សរមូល Web)', value: "'Moul', 'Khmer OS Muol Light', serif", group: 'khmer_web' },
  { label: 'Siemreap (សៀមរាប Web)', value: "'Siemreap', 'Khmer OS Siemreap', serif", group: 'khmer_web' },
  { label: 'Kantumruy Pro (ទំនើប)', value: "'Kantumruy Pro', sans-serif", group: 'khmer_web' },
  { label: 'Battambang (បាត់ដំបង)', value: "'Battambang', 'Khmer OS Battambang', serif", group: 'khmer_web' },
  { label: 'Koulen (គូលែន)', value: "'Koulen', 'Khmer OS Muol', sans-serif", group: 'khmer_web' },
  { label: 'Metal (មេតាល់)', value: "'Metal', 'Khmer OS Bokor', serif", group: 'khmer_web' },
  { label: 'Suwannaphum (សុវណ្ណភូមិ)', value: "'Suwannaphum', serif", group: 'khmer_web' },
  { label: 'Hanuman (ហនុមាន)', value: "'Hanuman', serif", group: 'khmer_web' },
  { label: 'Chenla (ចេនឡា)', value: "'Chenla', serif", group: 'khmer_web' },
  { label: 'Fasthand (អក្សរដៃ)', value: "'Fasthand', cursive", group: 'khmer_web' },

  // Khmer Local PC Fonts (Windows / Office)
  { label: 'Khmer OS Muol Light (PC)', value: "'Khmer OS Muol Light', 'Moul', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Muol (PC)', value: "'Khmer OS Muol', 'Moul', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Muol Pali (PC)', value: "'Khmer OS Muol Pali', 'Khmer OS Muol Light', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Siemreap (PC)', value: "'Khmer OS Siemreap', 'Siemreap', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Battambang (PC)', value: "'Khmer OS Battambang', 'Battambang', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Content (PC)', value: "'Khmer OS Content', 'Siemreap', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Bokor (PC)', value: "'Khmer OS Bokor', 'Metal', serif", group: 'khmer_pc' },
  { label: 'Khmer OS Freehand (PC)', value: "'Khmer OS Freehand', 'Fasthand', cursive", group: 'khmer_pc' },
  { label: 'Khmer OS Metal Chrieng (PC)', value: "'Khmer OS Metal Chrieng', serif", group: 'khmer_pc' },
  { label: 'Khmer OS System (PC)', value: "'Khmer OS System', sans-serif", group: 'khmer_pc' },
  { label: 'Khmer OS Moulpali (PC)', value: "'Khmer OS Moulpali', 'Moul', serif", group: 'khmer_pc' },
  { label: 'Tacteing (PC)', value: "'Tacteing', serif", group: 'khmer_pc' },

  // English Web Fonts
  { label: 'Georgia (Classic)', value: "'Georgia', 'Times New Roman', serif", group: 'english_web' },
  { label: 'Playfair Display (Elegant)', value: "'Playfair Display', Georgia, serif", group: 'english_web' },
  { label: 'Cinzel (Certificate)', value: "'Cinzel', Georgia, serif", group: 'english_web' },
  { label: 'Inter (Modern)', value: "'Inter', sans-serif", group: 'english_web' },
  { label: 'Roboto', value: "'Roboto', sans-serif", group: 'english_web' },
  { label: 'Open Sans', value: "'Open Sans', sans-serif", group: 'english_web' },

  // English Local PC Fonts (Windows / Office)
  { label: 'Times New Roman (PC)', value: "'Times New Roman', Georgia, serif", group: 'english_pc' },
  { label: 'Calibri (PC)', value: "'Calibri', sans-serif", group: 'english_pc' },
  { label: 'Cambria (PC)', value: "'Cambria', Georgia, serif", group: 'english_pc' },
  { label: 'Arial (PC)', value: "'Arial', Helvetica, sans-serif", group: 'english_pc' },
  { label: 'Tahoma (PC)', value: "'Tahoma', sans-serif", group: 'english_pc' },
  { label: 'Verdana (PC)', value: "'Verdana', sans-serif", group: 'english_pc' },
  { label: 'Segoe UI (PC)', value: "'Segoe UI', sans-serif", group: 'english_pc' },
  { label: 'Garamond (PC)', value: "'Garamond', Georgia, serif", group: 'english_pc' },
  { label: 'Monotype Corsiva (PC)', value: "'Monotype Corsiva', cursive", group: 'english_pc' },
  { label: 'Brush Script MT (PC)', value: "'Brush Script MT', cursive", group: 'english_pc' },
  { label: 'Bookman Old Style (PC)', value: "'Bookman Old Style', Georgia, serif", group: 'english_pc' },
  { label: 'Palatino Linotype (PC)', value: "'Palatino Linotype', Georgia, serif", group: 'english_pc' },
];

export function formatLocalFontFamilyCss(familyName: string): string {
  const clean = String(familyName || '').replace(/["'<>;&]/g, '').trim();
  if (!clean) return "'Siemreap', 'Georgia', serif";
  return `'${clean}', 'Siemreap', 'Georgia', serif`;
}

const ALLOWED_TAGS = new Set([
  'div',
  'p',
  'br',
  'span',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'font',
  'sub',
  'sup',
]);

const ALLOWED_CSS_PROPS = new Set([
  'font-family',
  'font-size',
  'color',
  'background-color',
  'background',
  'font-weight',
  'font-style',
  'text-decoration',
  'text-decoration-line',
  'text-decoration-style',
  'text-decoration-color',
  'text-align',
  'line-height',
  'letter-spacing',
  'word-spacing',
  'width',
  'border-bottom',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'display',
  'padding',
  'padding-top',
  'padding-bottom',
  'padding-left',
  'padding-right',
  'margin',
  'margin-top',
  'margin-bottom',
  'margin-left',
  'margin-right',
  'min-width',
  'white-space',
  'text-shadow',
]);

function sanitizeInlineStyle(rawStyle: string): string {
  if (!rawStyle) return '';
  // Decode HTML entities BEFORE splitting by ';' so Chrome-serialized &quot; in font-family never breaks!
  const decoded = rawStyle
    .replace(/&quot;/gi, "'")
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&')
    .replace(/"/g, "'");

  const safeParts: string[] = [];
  decoded.split(';').forEach((decl) => {
    const colonIdx = decl.indexOf(':');
    if (colonIdx === -1) return;
    const prop = decl.slice(0, colonIdx).trim().toLowerCase();
    const val = decl.slice(colonIdx + 1).trim();
    if (!ALLOWED_CSS_PROPS.has(prop) || !val) return;
    if (/url\s*\(|expression\s*\(|javascript:|@import|[<>]/i.test(val)) return;
    safeParts.push(`${prop}: ${val}`);
  });
  return safeParts.join('; ');
}

function escapeHtmlText(text: string): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Sanitizes Word-edited HTML safely for rendering inside certificates.
 * Keeps rich text formatting tags and whitelisted inline styles while stripping any scripts/handlers.
 */
export function sanitizeCertRichHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  const strippedDangerous = rawHtml
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<\s*(script|iframe|object|embed|style|link|meta)[^>]*\/?\s*>/gi, '');

  return strippedDangerous.replace(
    /<(\/?)\s*([a-zA-Z0-9]+)([^>]*)>/g,
    (_full, slash: string, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      if (slash === '/') return tag === 'font' ? '</span>' : `</${tag}>`;
      if (tag === 'br') return '<br />';

      let styleStr = '';
      const styleMatch = attrs.match(/\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (styleMatch) {
        styleStr = sanitizeInlineStyle(styleMatch[1] ?? styleMatch[2] ?? '');
      }

      // Convert legacy <font face="..." color="..."> attributes to clean inline styles
      if (tag === 'font') {
        const extra: string[] = [];
        const faceMatch = attrs.match(/\bface\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
        const colorMatch = attrs.match(/\bcolor\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
        if (faceMatch) {
          const cleanFace = (faceMatch[1] ?? faceMatch[2] ?? '').replace(/[<>;&]/g, '');
          if (cleanFace) extra.push(`font-family: ${cleanFace}`);
        }
        if (colorMatch) {
          const cleanColor = (colorMatch[1] ?? colorMatch[2] ?? '').replace(/[<>;&]/g, '');
          if (cleanColor) extra.push(`color: ${cleanColor}`);
        }
        const merged = [extra.join('; '), styleStr].filter(Boolean).join('; ');
        return merged ? `<span style="${merged}">` : '<span>';
      }

      let dataTokenAttr = '';
      const tokenMatch = attrs.match(/\bdata-token\s*=\s*(?:"([a-zA-Z0-9_]+)"|'([a-zA-Z0-9_]+)')/i);
      if (tokenMatch) {
        dataTokenAttr = ` data-token="${tokenMatch[1] || tokenMatch[2]}"`;
      }

      const alignMatch = attrs.match(/\balign\s*=\s*(?:"(left|center|right|justify)"|'(left|center|right|justify)')/i);
      if (alignMatch && !/text-align\s*:/i.test(styleStr)) {
        const al = (alignMatch[1] || alignMatch[2]).toLowerCase();
        styleStr = styleStr ? `${styleStr}; text-align: ${al}` : `text-align: ${al}`;
      }

      return styleStr
        ? `<${tag}${dataTokenAttr} style="${styleStr}">`
        : `<${tag}${dataTokenAttr}>`;
    }
  );
}

/**
 * Sanitizes rich HTML and substitutes {{dataField}} placeholders with live student/exam values.
 */
export function interpolateCertRichHtml(
  rawHtml: string,
  tokenMap: Record<string, string>
): string {
  const safeHtml = sanitizeCertRichHtml(rawHtml);
  return safeHtml.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, key: string) => {
    if (Object.prototype.hasOwnProperty.call(tokenMap, key)) {
      return escapeHtmlText(tokenMap[key] ?? '');
    }
    return `{{${key}}}`;
  });
}

export interface DefaultRichHtmlDesignHints {
  khmerTitleFont: string;
  khmerBodyFont: string;
  studentNameKhFont: string;
  englishFont: string;
  mottoColor: string;
  mottoKhFontPt: number;
  mottoEnFontPt: number;
  titleFontPt: number;
  subtitleFontPt: number;
  certTitleColor: string;
  frameTitleColor: string;
  frameInnerColor: string;
  studentNameKhPt: number;
  studentNameEnPt: number;
  khmerBodyFontPt: number;
  englishBodyFontPt: number;
  valueColor: string;
  accentColor: string;
  bodyColor: string;
  dottedLineColor: string;
}

/**
 * Generates editable Word-ready rich HTML prefilled with live {{dataField}} tokens
 * matching each built-in TextBox for both Praise Letter and Course Completion Certificate.
 */
export function getDefaultTextBoxRichHtml(
  boxKey: CertTextBoxKey,
  docType: 'praise' | 'certificate',
  hints: DefaultRichHtmlDesignHints
): string {
  const isCert = docType === 'certificate';
  const dotColor = hints.dottedLineColor || '#1f2937';

  if (boxKey === 'nationalMotto') {
    return [
      `<div style="font-family: ${hints.khmerTitleFont}; font-size: ${hints.mottoKhFontPt}pt; color: ${hints.mottoColor};">ព្រះរាជាណាចក្រកម្ពុជា</div>`,
      `<div style="font-family: ${hints.englishFont}; font-size: ${hints.mottoEnFontPt}pt; font-weight: 700; color: ${hints.mottoColor}; letter-spacing: 0.5px;">KINGDOM OF CAMBODIA</div>`,
      `<div style="font-family: ${hints.khmerTitleFont}; font-size: ${Math.max(5.5, hints.mottoKhFontPt - 0.5)}pt; color: ${hints.mottoColor};">ជាតិ&nbsp;&nbsp;សាសនា&nbsp;&nbsp;ព្រះមហាក្សត្រ</div>`,
      `<div style="font-family: ${hints.englishFont}; font-size: ${Math.max(4.5, hints.mottoEnFontPt - 0.3)}pt; font-weight: 700; color: ${hints.mottoColor}; letter-spacing: 0.55px;">NATION&nbsp;&nbsp;&nbsp;RELIGION&nbsp;&nbsp;&nbsp;KING</div>`,
    ].join('');
  }

  if (boxKey === 'titleBlock') {
    const khColor = isCert ? hints.certTitleColor || '#dc2626' : hints.frameTitleColor;
    const enColor = isCert ? hints.certTitleColor || '#dc2626' : hints.frameInnerColor;
    const khTitle = isCert ? 'វិញ្ញាបនបត្របញ្ជាក់ការសិក្សា' : 'ប័ណ្ណសរសើរ';
    const enTitle = isCert ? 'CERTIFICATE' : 'LETTER OF ADMIRATION';
    return [
      `<div style="font-family: ${hints.khmerTitleFont}; font-size: ${hints.titleFontPt}pt; color: ${khColor};">${khTitle}</div>`,
      `<div style="font-family: ${hints.englishFont}; font-size: ${hints.subtitleFontPt}pt; font-weight: 700; color: ${enColor}; letter-spacing: 1.3px;">${enTitle}</div>`,
    ].join('');
  }

  if (boxKey === 'certNumber') {
    return `<div>No. <span data-token="certNo" style="font-weight: 700; color: #0f172a; border-bottom: 1px dotted ${dotColor}; padding: 0 3mm; min-width: 16mm; display: inline-block; text-align: center;">{{certNo}}</span></div>`;
  }

  if (boxKey === 'classMeta') {
    return [
      `<div style="font-weight: 700; color: #475569;">ថ្នាក់ {{classCode}} ({{level}})</div>`,
      `<div>គ្រូ៖ {{teacherName}}</div>`,
      `<div>ID: {{studentId}}</div>`,
    ].join('');
  }

  if (boxKey === 'issuedDateBlock') {
    if (isCert) {
      return [
        `<div>Issued Dated</div>`,
        `<div style="font-weight: 600;">{{certPlaceDate}}</div>`,
      ].join('');
    }
    return `<div>Issued Date&nbsp;&nbsp;&nbsp;&nbsp;<strong>{{issuedDate}}</strong></div>`;
  }

  if (boxKey === 'principalTitleBlock') {
    return `<div style="font-weight: 700;">{{principalTitle}}</div>`;
  }

  if (boxKey === 'signatoryName') {
    return `<div style="font-family: ${hints.studentNameKhFont};">{{signatoryName}}</div>`;
  }

  if (boxKey === 'khmerBody') {
    if (isCert) {
      return [
        `<div>សូមបញ្ជាក់ថា <span data-token="studentNameKh" style="font-family: ${hints.studentNameKhFont}; font-size: ${hints.studentNameKhPt}pt; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 3mm;">{{studentNameKh}}</span> ភេទ <span data-token="genderKh" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 2mm;">{{genderKh}}</span></div>`,
        `<div>ថ្ងៃខែឆ្នាំកំណើត <span data-token="dobKh" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 4mm;">{{dobKh}}</span></div>`,
        `<div>បានប្រឡងបញ្ចប់ដោយជោគជ័យនូវវគ្គសិក្សា៖</div>`,
        `<div><strong>{{courseKh}}</strong> កម្រិត <span data-token="level" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 4mm;">{{level}}</span></div>`,
        `<div>ទទួលបាននិទ្ទេស <span data-token="gradeKh" style="font-family: ${hints.studentNameKhFont}; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 4mm;">{{gradeKh}}</span></div>`,
        `<div>វិញ្ញាបនបត្រនេះត្រូវបានប្រគល់ជូនសាម៉ីខ្លួនដើម្បីប្រើប្រាស់<br />តាមការដែលអាចប្រើបាន។</div>`,
      ].join('');
    }
    return [
      `<div>{{schoolNameKh}} សូមសរសើរចំពោះសិស្ស</div>`,
      `<div>ឈ្មោះ ៖ <span data-token="studentNameKh" style="font-family: ${hints.studentNameKhFont}; font-size: ${hints.studentNameKhPt}pt; color: ${hints.valueColor};">{{studentNameKh}}</span> &nbsp;&nbsp; ភេទ <strong style="color: ${hints.valueColor};">{{genderKh}}</strong></div>`,
      `<div>ដែលបានជាប់ចំណាត់ថ្នាក់លេខ ៖ <strong style="color: ${hints.valueColor}; font-size: ${hints.khmerBodyFontPt + 1.8}pt;">{{rankKh}}</strong> &nbsp;&nbsp; និទ្ទេស <strong style="color: ${hints.accentColor}; font-size: ${hints.khmerBodyFontPt + 1.8}pt;">{{grade}}</strong></div>`,
      `<div>នៃការប្រឡង <strong style="color: ${hints.valueColor};">{{examKh}}</strong></div>`,
      `<div>វគ្គសិក្សាសៀវភៅ ៖ <strong style="color: ${hints.valueColor};">{{level}}</strong></div>`,
      `<div>ដែលបានប្រព្រឹត្តទៅនៅថ្ងៃទី ៖ <strong style="color: ${hints.valueColor};">{{conductedDate}}</strong></div>`,
    ].join('');
  }

  // englishBody
  if (isCert) {
    return [
      `<div>This is to certify that <span data-token="studentNameEnUpper" style="font-size: ${hints.studentNameEnPt}pt; font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 3mm;">{{studentNameEnUpper}}</span></div>`,
      `<div>Gender <span data-token="genderEn" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 2mm;">{{genderEn}}</span> Date of birth <span data-token="dobEn" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 3mm;">{{dobEn}}</span></div>`,
      `<div>who has successfully passed in the final exam of</div>`,
      `<div><strong>{{courseEn}}</strong> level <span data-token="level" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 4mm;">{{level}}</span></div>`,
      `<div>With the grade of <span data-token="gradeEn" style="font-weight: 700; color: ${hints.valueColor}; border-bottom: 1px dotted ${dotColor}; padding: 0 4mm;">{{gradeEn}}</span></div>`,
      `<div>This Certificate is presented to the bearer for official uses.</div>`,
    ].join('');
  }

  return [
    `<div>The Director of BSIS gives this admirable letter</div>`,
    `<div>to <strong style="font-size: ${hints.studentNameEnPt}pt; color: ${hints.valueColor};">{{studentNameEn}}</strong> &nbsp;&nbsp; Gender: <strong style="color: ${hints.valueColor};">{{genderEn}}</strong></div>`,
    `<div>who has successfully got the <strong style="color: ${hints.accentColor}; font-size: ${hints.englishBodyFontPt + 2}pt;">{{rankEn}}</strong> &nbsp; grade <strong style="color: ${hints.accentColor}; font-size: ${hints.englishBodyFontPt + 2}pt;">{{grade}}</strong></div>`,
    `<div>of <strong style="color: ${hints.valueColor};">{{examEn}}</strong></div>`,
    `<div>Level <strong style="color: ${hints.valueColor};">{{level}}</strong></div>`,
    `<div>which was conducted on <strong style="color: ${hints.valueColor};">{{conductedDate}}</strong></div>`,
  ].join('');
}
