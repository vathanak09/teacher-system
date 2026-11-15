"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface ScoresGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideSectionId =
  | "all"
  | "overview"
  | "entry"
  | "calculation"
  | "csv_clear"
  | "admin_sheets";

interface SectionTab {
  id: GuideSectionId;
  label: string;
}

const SECTION_TABS: SectionTab[] = [
  { id: "all", label: "ទាំងអស់" },
  { id: "overview", label: "១. រើសថ្នាក់ & ខែ" },
  { id: "entry", label: "២. ទាញសិស្ស & បញ្ចូលពិន្ទុ" },
  { id: "calculation", label: "៣. មេគុណ & និទ្ទេស" },
  { id: "csv_clear", label: "៤. Excel/CSV & ការលុប" },
  { id: "admin_sheets", label: "៥. Google Sheets (Admin)" },
];

export default function ScoresGuideModal({ isOpen, onClose }: ScoresGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideSectionId>("all");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const showSection = (id: Exclude<GuideSectionId, "all">) =>
    activeTab === "all" || activeTab === id;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scores-guide-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20050,
        background: "rgba(15, 23, 42, 0.65)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-scale-in"
        style={{
          width: "100%",
          maxWidth: "960px",
          maxHeight: "90vh",
          background: "var(--modal-bg, #ffffff)",
          border: "1px solid var(--border-color)",
          borderRadius: "20px",
          boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
            background:
              "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.08))",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                background: "rgba(245, 158, 11, 0.18)",
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "1px solid rgba(245, 158, 11, 0.35)",
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <h2
                id="scores-guide-title"
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                ការណែនាំប្រើប្រាស់ផ្ទាំងបញ្ជីពិន្ទុ (Scores User Guide)
              </h2>
              <p
                style={{
                  margin: "0.2rem 0 0 0",
                  fontSize: "0.88rem",
                  color: "var(--text-secondary)",
                }}
              >
                សេចក្តីណែនាំលម្អិតសម្រាប់លោកគ្រូ អ្នកគ្រូ និង Admin លើការគ្រប់គ្រង និងបញ្ចូលពិន្ទុប្រចាំខែ
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: "10px",
              border: "1px solid var(--border-color)",
              background: "var(--card-bg, var(--bg-secondary))",
              color: "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.9rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              flexShrink: 0,
            }}
          >
            <span>បិទ</span>
            <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>&times;</span>
          </button>
        </div>

        {/* Section Tabs */}
        <div
          style={{
            padding: "0.75rem 1.5rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            background: "var(--bg-secondary)",
          }}
        >
          {SECTION_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "999px",
                  border: isActive
                    ? "1px solid #3b82f6"
                    : "1px solid var(--border-color)",
                  background: isActive ? "#3b82f6" : "var(--card-bg)",
                  color: isActive ? "#ffffff" : "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  fontWeight: isActive ? 600 : 500,
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            padding: "1.5rem",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Quick Start Workflow Banner */}
          <div
            style={{
              padding: "1rem 1.15rem",
              borderRadius: "14px",
              background: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: "0.95rem",
                color: "#2563eb",
                marginBottom: "0.65rem",
              }}
            >
              សង្ខេបជំហានទាំង ៤ ដើម្បីបញ្ចូលពិន្ទុប្រចាំខែឱ្យបានលឿន
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "0.75rem",
              }}
            >
              {[
                {
                  step: "ជំហានទី ១",
                  text: "រើស «ខែ/ឆ្នាំ» ដែលត្រូវបញ្ចូល រួចចុចលើកាត «ថ្នាក់រៀន» របស់លោកគ្រូ អ្នកគ្រូ។",
                },
                {
                  step: "ជំហានទី ២",
                  text: "ចុចប៊ូតុងពណ៌ខៀវ «+» ដើម្បីទាញយកឈ្មោះសិស្សពីថ្នាក់ចូលក្នុងខែនោះ។",
                },
                {
                  step: "ជំហានទី ៣",
                  text: "វាយពិន្ទុតាមមុខវិជ្ជា (Quiz, Exercise, Speaking, Homework, Test) ឬ Copy/Paste ពី Excel។",
                },
                {
                  step: "ជំហានទី ៤",
                  text: "ពិនិត្យមើល «មេគុណ», «និទ្ទេស» និង «សរុបស្ថិតិ» ខាងក្រោម (ប្រព័ន្ធ Save ដោយស្វ័យប្រវត្តិ)។",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  style={{
                    padding: "0.75rem",
                    borderRadius: "10px",
                    background: "var(--card-bg, #ffffff)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "#3b82f6",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {item.step}
                  </div>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-primary)",
                      lineHeight: 1.5,
                    }}
                  >
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 1: Overview, Search, Filter, Month & Progress */}
          {showSection("overview") && (
            <section style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <Badge color="#3b82f6">១</Badge>
                ទំព័រដំបូង៖ ការស្វែងរក តម្រងថ្នាក់ និងការជ្រើសរើសខែ/ឆ្នាំ
              </h3>
              <ul style={listStyle}>
                <li>
                  <strong>ប្រអប់ស្វែងរកឈ្មោះថ្នាក់រៀន៖</strong> វាយឈ្មោះថ្នាក់ ឬកូដថ្នាក់ ដើម្បីស្វែងរកថ្នាក់រៀនរបស់អ្នកយ៉ាងរហ័ស។
                </li>
                <li>
                  <strong>ប៊ូតុង «ជ្រើសរើសថ្នាក់»៖</strong> ប្រើសម្រាប់ Tick ជ្រើសរើសបង្ហាញតែថ្នាក់ណាដែលអ្នកបង្រៀន ឬចង់តាមដាន (ប្រព័ន្ធចងចាំការជ្រើសរើសនេះទុកស្វ័យប្រវត្តិ ហើយក៏ប្រើសម្រាប់ជ្រើសថ្នាក់ Sync ទៅ Google Sheets ផងដែរ)។
                </li>
                <li>
                  <strong>ប្រអប់ «ខែ/ឆ្នាំ»៖</strong> រើសខែ និងឆ្នាំដែលត្រូវបញ្ចូល ឬពិនិត្យពិន្ទុ។ កាតថ្នាក់នីមួយៗនឹងបង្ហាញវឌ្ឍនភាពប្រចាំខែនោះ៖
                  <div style={subNoteStyle}>
                    • <span style={{ color: "#10b981", fontWeight: 700 }}>បញ្ចូលរួចរាល់ ✔</span> នៅពេលបញ្ចូលពិន្ទុសិស្សបានចាប់ពី <b>80%</b> ឡើងទៅ។
                    <br />• <span style={{ color: "#ef4444", fontWeight: 700 }}>មិនទាន់បញ្ចូល ✖</span> នៅពេលពិន្ទុទទួលបាននៅក្រោម 80% ឬមិនទាន់មានទិន្នន័យ។
                  </div>
                </li>
                <li>
                  <strong>សិទ្ធិមើលថ្នាក់៖</strong> គណនីគ្រូបង្រៀន (Teacher) ឃើញតែថ្នាក់ដែលខ្លួនទទួលបន្ទុក ចំណែក Admin អាចមើលឃើញថ្នាក់ទាំងអស់។
                </li>
              </ul>
            </section>
          )}

          {/* Section 2: Import Students & Enter Scores */}
          {showSection("entry") && (
            <section style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <Badge color="#10b981">២</Badge>
                ក្នុងថ្នាក់រៀន៖ ការទាញឈ្មោះសិស្ស និងការបញ្ចូលពិន្ទុ
              </h3>
              <ul style={listStyle}>
                <li>
                  <strong>ប៊ូតុង <Pill bg="#3b82f6" color="#fff">+</Pill> (ទាញយកបញ្ជីឈ្មោះសិស្សពីថ្នាក់)៖</strong> រាល់ដើមខែថ្មី តារាងអាចនៅទទេ។ សូមចុចប៊ូតុងរាងមូលពណ៌ខៀវ <b>«+»</b> ដើម្បីទាញឈ្មោះសិស្សដែលកំពុងសិក្សាក្នុងថ្នាក់ (មិនរាប់បញ្ចូលសិស្ស «ឈប់រៀន») ចូលក្នុងខែដែលបានជ្រើសរើស។
                  <div style={subNoteStyle}>
                    * ប្រសិនបើមានសិស្សថ្មីចូលថ្នាក់ពាក់កណ្តាលខែ អាចចុចប៊ូតុង <b>«+»</b> ម្តងទៀត ដើម្បីទាញតែសិស្សថ្មីបន្ថែម ដោយមិនប៉ះពាល់ពិន្ទុសិស្សចាស់ទេ។
                  </div>
                </li>
                <li>
                  <strong>ការបង្ហាញចំនួនសិស្ស៖</strong> ខាងលើតារាងមានផ្លាកបង្ហាញចំនួន <b>សរុប</b>, <b>ស្រី</b> និង <b>ប្រុស</b> សម្រាប់ខែនោះ។ ជួរឈរ <b>«ឈ្មោះសិស្ស»</b> ត្រូវបានចាក់សោជាប់ខាងឆ្វេង ដើម្បីងាយស្រួលមើលពេលអូសតារាងទៅស្តាំ។
                </li>
                <li>
                  <strong>ជួរឈរសម្រាប់វាយពិន្ទុទាំង ៥៖</strong> លោកគ្រូ អ្នកគ្រូ អាចបញ្ចូលលេខចូលក្នុងប្រអប់ <b>Quiz</b>, <b>Exercise</b>, <b>Speaking</b>, <b>Homework</b>, និង <b>Test</b>។
                  <div style={subNoteStyle}>
                    • រាល់ការវាយលេខ ឬលុបលេខ ប្រព័ន្ធនឹង <b>រក្សាទុក (Auto-Save) ដោយស្វ័យប្រវត្តិ</b> ភ្លាមៗ ដោយមិនបាច់ចុចប៊ូតុង Save ឡើយ។
                    <br />• ជួរឈរ <b>ពិន្ទុសរុប</b>, <b>មធ្យមភាគ</b>, <b>និទ្ទេស</b>, <b>ចំណាត់ថ្នាក់</b> និង <b>មូលវិចារណ៍</b> ត្រូវបានគណនាដោយស្វ័យប្រវត្តិ។
                  </div>
                </li>
                <li>
                  <strong>គន្លឹះ Copy/Paste ពី Excel ឱ្យលឿន៖</strong> Copy (<code>Ctrl+C</code>) ជួរឈរពិន្ទុ ១ ជួរឈរពី Excel រួចចុចលើប្រអប់សិស្សដំបូងក្នុងតារាង ហើយ Paste (<code>Ctrl+V</code>) — ប្រព័ន្ធនឹងបំពេញទិន្នន័យចុះក្រោមតាមជួរជូនសិស្សជាបន្តបន្ទាប់ដោយស្វ័យប្រវត្តិ។
                </li>
              </ul>
            </section>
          )}

          {/* Section 3: Coefficient, Grading, Sorting, Stats */}
          {showSection("calculation") && (
            <section style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <Badge color="#8b5cf6">៣</Badge>
                ការកំណត់មេគុណ (🔢) និទ្ទេស ការតម្រៀប និងសរុបស្ថិតិ
              </h3>
              <ul style={listStyle}>
                <li>
                  <strong>ប៊ូតុង «🔢 មេគុណ» (Coefficient)៖</strong> ចុចដើម្បីជ្រើសរើសវិធីគណនាមធ្យមភាគ (លើមាត្រដ្ឋាន ៥០) មាន ២ ជម្រើស៖
                  <div style={subNoteStyle}>
                    ១. <b>ផ្អែកតាមពិន្ទុអតិបរមាក្នុងបញ្ជី (Auto)៖</b> មេគុណ = (ពិន្ទុសរុបខ្ពស់បំផុតក្នុងថ្នាក់ + ៥) ÷ ៥០។
                    <br />២. <b>កំណត់ពិន្ទុអតិបរមាខ្លួនឯង (Custom)៖</b> មេគុណ = ពិន្ទុអតិបរមាដែលអ្នកកំណត់ (ឧ. ២៥០) ÷ ៥០។
                    <br />→ <b>មធ្យមភាគ</b> = ពិន្ទុសរុប ÷ មេគុណ។
                  </div>
                </li>
                <li>
                  <strong>ការផ្តល់និទ្ទេស និងមូលវិចារណ៍ស្វ័យប្រវត្តិ (គិតជាភាគរយធៀបនឹង ៥០)៖</strong>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem", marginTop: "0.45rem" }}>
                    {[
                      { g: "A", rule: "≥ 90%", note: "ល្អប្រសើរ", bg: "rgba(239, 68, 68, 0.12)", c: "#dc2626" },
                      { g: "B", rule: "80% – 89%", note: "ល្អ", bg: "rgba(239, 68, 68, 0.1)", c: "#ef4444" },
                      { g: "C", rule: "70% – 79%", note: "ល្អបង្គួរ", bg: "rgba(192, 38, 211, 0.12)", c: "#c026d3" },
                      { g: "D", rule: "60% – 69%", note: "មធ្យម", bg: "rgba(22, 163, 74, 0.12)", c: "#16a34a" },
                      { g: "E", rule: "50% – 59%", note: "មធ្យម", bg: "rgba(22, 163, 74, 0.1)", c: "#15803d" },
                      { g: "F", rule: "< 50%", note: "ខ្សោយ", bg: "rgba(100, 116, 139, 0.14)", c: "#475569" },
                    ].map((item) => (
                      <span
                        key={item.g}
                        style={{
                          padding: "0.25rem 0.6rem",
                          borderRadius: "8px",
                          background: item.bg,
                          color: item.c,
                          fontSize: "0.82rem",
                          fontWeight: 600,
                        }}
                      >
                        និទ្ទេស {item.g} ({item.rule})៖ {item.note}
                      </span>
                    ))}
                  </div>
                </li>
                <li>
                  <strong>ការតម្រៀប (Sort)៖</strong> តាមលំនាំដើម ប្រព័ន្ធតម្រៀប <b>សិស្សស្រីមុនសិស្សប្រុស</b> រួចតាមអក្ខរក្រមឈ្មោះ។ លោកគ្រូ អ្នកគ្រូ អាចតម្រៀបតាម <b>អត្តលេខ</b>, <b>ឈ្មោះសិស្ស</b>, <b>ភេទ</b>, <b>ពិន្ទុសរុប</b>, <b>មធ្យមភាគ</b> ឬ <b>ចំណាត់ថ្នាក់</b>។
                </li>
                <li>
                  <strong>ប្រអប់ «សរុបស្ថិតិ» ខាងក្រោមតារាង៖</strong> បង្ហាញចំនួនសិស្សសរុប ចំនួនសិស្សស្រី ចំនួន និងភាគរយសិស្សតាមនិទ្ទេស A ដល់ F និងចំនួន <b>អវត្តមាន</b> (សិស្សដែលមិនទាន់មានពិន្ទុសរុប)។
                </li>
              </ul>
            </section>
          )}

          {/* Section 4: CSV Import/Export & Clear Data */}
          {showSection("csv_clear") && (
            <section style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <Badge color="#f59e0b">៤</Badge>
                ការទាញយក / បញ្ចូលឯកសារ CSV និងការលុបទិន្នន័យ
              </h3>
              <ul style={listStyle}>
                <li>
                  <strong>ទាញយក Excel (.csv)៖</strong> ចុចប៊ូតុង <b>«ទាញយក Excel»</b> ដើម្បីទាញយកបញ្ជីពិន្ទុថ្នាក់ និងខែនោះចេញជាឯកសារ CSV សម្រាប់រក្សាទុក ឬបើកក្នុង Excel។
                </li>
                <li>
                  <strong>បញ្ចូល (Import .csv)៖</strong> ចុចប៊ូតុងពណ៌បៃតង <b>«បញ្ចូល (Import)»</b> ដើម្បីផ្ទុកពិន្ទុពីឯកសារ CSV ចូលប្រព័ន្ធ។
                  <div style={subNoteStyle}>
                    * <b>សំខាន់៖</b> ត្រូវចុចប៊ូតុង <b>«+»</b> ទាញឈ្មោះសិស្សចូលក្នុងខែនោះជាមុនសិន និងត្រូវប្រាកដថាឯកសារ CSV មានជួរឈរ <b>«អត្តលេខ»</b> និងក្បាលជួរឈរ <code>Quiz</code>, <code>Exercise</code>, <code>Speaking</code>, <code>Homework</code>, <code>Test</code> ឱ្យបានត្រឹមត្រូវ។
                  </div>
                </li>
                <li>
                  <strong>ប៊ូតុង «លុបទិន្នន័យ» (Clear)៖</strong> មានជម្រើសលុប ៣ កម្រិត (ដោយមានផ្ទាំងសួរបញ្ជាក់មុនលុបជានិច្ច)៖
                  <div style={subNoteStyle}>
                    • <b>លុបតាមជួរឈរ (Quiz / Exercise / Speaking / Homework / Test)៖</b> លុបពិន្ទុតែជួរឈរនោះប៉ុណ្ណោះ។
                    <br />• <b>លុបពិន្ទុទាំងអស់ (Clear All Scores)៖</b> សម្អាតពិន្ទុគ្រប់ជួរឈរ ប៉ុន្តែរក្សាទុកឈ្មោះសិស្ស។
                    <br />• <b>លុបបញ្ជីឈ្មោះទាំងអស់ (Delete List)៖</b> លុបទិន្នន័យសិស្សទាំងអស់ចេញពីខែនេះ។
                  </div>
                </li>
                <li>
                  <strong>រូបធុងសំរាមក្នុងជួរឈរ «ផ្សេងៗ»៖</strong> ប្រើសម្រាប់លុបសិស្ស <b>១ នាក់</b> ចេញពីបញ្ជីពិន្ទុប្រចាំខែនេះប៉ុណ្ណោះ (មិនប៉ះពាល់ទិន្នន័យសិស្សក្នុងថ្នាក់គោលទេ)។
                </li>
              </ul>
            </section>
          )}

          {/* Section 5: Admin & Google Sheets Sync */}
          {showSection("admin_sheets") && (
            <section style={sectionBoxStyle}>
              <h3 style={sectionTitleStyle}>
                <Badge color="#ec4899">៥</Badge>
                មុខងារ Google Sheets (សម្រាប់ Admin នៅទំព័រដំបូង)
              </h3>
              <ul style={listStyle}>
                <li>
                  <strong>ការកំណត់ (Settings)៖</strong> ដាក់ Link ឬ ID របស់ឯកសារ Google Sheets គោល។
                  <div style={subNoteStyle}>
                    * កុំភ្លេចចូល Google Sheets នោះហើយចុច Share (សិទ្ធិ Editor) ទៅកាន់អ៊ីមែលសេវាកម្ម{" "}
                    <code style={{ wordBreak: "break-all" }}>
                      bsis-936@high-magpie-503702-t0.iam.gserviceaccount.com
                    </code>{" "}
                    ជាមុនសិន ទើបអាច Sync ជោគជ័យ។
                  </div>
                </li>
                <li>
                  <strong>ទិន្នន័យបន្ថែម (Extra Data)៖</strong> កំណត់ <b>ឈ្មោះខែ (ភាសាខ្មែរ &amp; English)</b> និង <b>ថ្ងៃចេញរបាយការណ៍ (ភាសាខ្មែរ &amp; English)</b> សម្រាប់ខែដែលបានជ្រើសរើស ដើម្បីបញ្ជូនចូល Cell <code>AA1...</code> ក្នុង Google Sheets។
                </li>
                <li>
                  <strong>Sync Selected to Sheets៖</strong> ប្រើតម្រង <b>«ជ្រើសរើសថ្នាក់»</b> និងរើស <b>«ខែ/ឆ្នាំ»</b> ឱ្យត្រូវជាមុន រួចចុច <b>«Sync Selected to Sheets»</b> ដើម្បីបញ្ជូនតារាងពិន្ទុ មធ្យមភាគ និទ្ទេស ចំណាត់ថ្នាក់ មូលវិចារណ៍ និងឈ្មោះគ្រូបង្រៀននៃថ្នាក់ដែលបានជ្រើសរើសទាំងអស់ទៅ Google Sheets សម្រាប់បោះពុម្ព។
                </li>
              </ul>
            </section>
          )}
        </div>

        {/* Bottom Footer */}
        <div
          style={{
            padding: "0.9rem 1.5rem",
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-secondary)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            គន្លឹះ៖ ចុចគ្រាប់ចុច <code>ESC</code> ឬប៊ូតុង «យល់ព្រម / បិទ» ដើម្បីត្រឡប់ទៅបញ្ចូលពិន្ទុវិញ។
          </span>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary"
            style={{
              padding: "0.55rem 1.35rem",
              borderRadius: "10px",
              fontWeight: 600,
            }}
          >
            យល់ព្រម / បិទការណែនាំ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        width: "26px",
        height: "26px",
        borderRadius: "8px",
        background: `${color}1f`,
        color,
        border: `1px solid ${color}40`,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "0.88rem",
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

function Pill({
  children,
  bg,
  color,
}: {
  children: React.ReactNode;
  bg: string;
  color: string;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        background: bg,
        color,
        fontWeight: 700,
        fontSize: "0.85rem",
        verticalAlign: "middle",
        margin: "0 0.15rem",
      }}
    >
      {children}
    </span>
  );
}

const sectionBoxStyle: React.CSSProperties = {
  padding: "1.1rem 1.25rem",
  borderRadius: "14px",
  background: "var(--card-bg)",
  border: "1px solid var(--border-color)",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 0.75rem 0",
  fontSize: "1.05rem",
  fontWeight: 700,
  color: "var(--text-primary)",
  display: "flex",
  alignItems: "center",
  gap: "0.6rem",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "1.25rem",
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  fontSize: "0.92rem",
  lineHeight: 1.65,
  color: "var(--text-primary)",
};

const subNoteStyle: React.CSSProperties = {
  marginTop: "0.4rem",
  padding: "0.55rem 0.75rem",
  borderRadius: "8px",
  background: "var(--bg-secondary)",
  borderLeft: "3px solid var(--border-color)",
  fontSize: "0.86rem",
  color: "var(--text-secondary)",
  lineHeight: 1.6,
};
