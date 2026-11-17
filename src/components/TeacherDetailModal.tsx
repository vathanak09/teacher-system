"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { convertDriveImageLink } from "@/utils/driveLink";
import { formatDateToDMY } from "@/utils/dateFormatter";

interface TeacherDetailModalProps {
  teacher: any | null;
  isOwnProfile: boolean;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (teacher: any) => void;
  onPreviewPhoto: (url: string) => void;
}

export default function TeacherDetailModal({
  teacher,
  isOwnProfile,
  canEdit,
  onClose,
  onEdit,
  onPreviewPhoto,
}: TeacherDetailModalProps) {
  useEffect(() => {
    if (!teacher) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [teacher, onClose]);

  if (!teacher || typeof document === "undefined") return null;

  const photoUrl = teacher.photo ? convertDriveImageLink(teacher.photo) : "";
  const isFemale = teacher.gender === "ស្រី";
  const initial = (teacher.fullName || teacher.englishName || "T").trim().charAt(0).toUpperCase();

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20020,
        background: "rgba(15, 23, 42, 0.6)",
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
          maxWidth: "560px",
          maxHeight: "90vh",
          overflowY: "auto",
          background: "var(--modal-bg, #ffffff)",
          borderRadius: "22px",
          border: "1px solid var(--border-color)",
          boxShadow: "0 24px 55px rgba(0, 0, 0, 0.35)",
          position: "relative",
        }}
      >
        {/* Top Accent Banner */}
        <div
          style={{
            height: "105px",
            background: isFemale
              ? "linear-gradient(135deg, rgba(236, 72, 153, 0.28), rgba(139, 92, 246, 0.25))"
              : "linear-gradient(135deg, rgba(59, 130, 246, 0.28), rgba(16, 185, 129, 0.22))",
            position: "relative",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="បិទ"
            style={{
              position: "absolute",
              top: "0.9rem",
              right: "0.9rem",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "var(--modal-bg, rgba(255,255,255,0.9))",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Profile Header Overlapping Banner */}
        <div style={{ padding: "0 1.5rem 1.5rem", marginTop: "-52px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <div
              onClick={() => photoUrl && onPreviewPhoto(photoUrl)}
              style={{
                width: "104px",
                height: "104px",
                borderRadius: "24px",
                overflow: "hidden",
                border: "4px solid var(--modal-bg, #ffffff)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.18)",
                background: isFemale
                  ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
                  : "linear-gradient(135deg, #3b82f6, #10b981)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                fontSize: "2.35rem",
                fontWeight: 700,
                cursor: photoUrl ? "pointer" : "default",
                flexShrink: 0,
              }}
              title={photoUrl ? "ចុចដើម្បីមើលរូបភាពធំ" : undefined}
            >
              {photoUrl ? (
                <img src={photoUrl} alt={teacher.fullName || ""} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                initial
              )}
            </div>

            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", paddingBottom: "0.25rem" }}>
              {isOwnProfile && (
                <span
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "999px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    background: "rgba(59, 130, 246, 0.14)",
                    color: "#2563eb",
                  }}
                >
                  ប្រវត្តិរូបរបស់ខ្ញុំ
                </span>
              )}
              <span
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  background: teacher.status === "កំពុងបង្រៀន" ? "rgba(16, 185, 129, 0.14)" : "rgba(239, 68, 68, 0.14)",
                  color: teacher.status === "កំពុងបង្រៀន" ? "#10b981" : "#ef4444",
                }}
              >
                {teacher.status || "កំពុងបង្រៀន"}
              </span>
            </div>
          </div>

          <h2 style={{ margin: 0, fontSize: "1.45rem", fontWeight: 700, color: "var(--text-primary)" }}>
            {teacher.fullName}
          </h2>
          {teacher.englishName && (
            <div style={{ fontSize: "0.98rem", color: "var(--text-secondary)", marginTop: "0.15rem", fontWeight: 500 }}>
              {teacher.englishName}
            </div>
          )}

          {/* Key Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.85rem" }}>
            {teacher.teacherId && (
              <span style={tagStyle}>
                អត្តលេខ៖ <b>{teacher.teacherId}</b>
              </span>
            )}
            {teacher.subject && (
              <span style={{ ...tagStyle, background: "rgba(139, 92, 246, 0.12)", color: "#7c3aed" }}>
                មុខវិជ្ជា៖ <b>{teacher.subject}</b>
              </span>
            )}
            {teacher.gender && (
              <span style={tagStyle}>
                ភេទ៖ <b>{teacher.gender}</b>
              </span>
            )}
          </div>

          {/* Info Grid */}
          <div
            style={{
              marginTop: "1.15rem",
              padding: "1rem",
              borderRadius: "14px",
              background: "var(--main-bg)",
              border: "1px solid var(--border-color)",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "0.85rem",
            }}
          >
            <InfoItem label="លេខទូរស័ព្ទ" value={teacher.phone} href={teacher.phone ? `tel:${teacher.phone}` : undefined} />
            <InfoItem label="ថ្ងៃខែឆ្នាំកំណើត" value={formatDateToDMY(teacher.dob) || "មិនមាន"} />
            <InfoItem label="ថ្ងៃចូលបង្រៀន" value={formatDateToDMY(teacher.joinDate) || "មិនមាន"} />
            <InfoItem label="អាសយដ្ឋាន" value={teacher.address || "មិនមាន"} />
          </div>

          {/* Contacts */}
          {(teacher.contacts?.telegram || teacher.contacts?.facebook || teacher.contacts?.other?.link) && (
            <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", gap: "0.6rem" }}>
              {teacher.contacts?.telegram && (
                <a
                  href={teacher.contacts.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...contactPillStyle, background: "rgba(0, 136, 204, 0.12)", color: "#0088cc" }}
                >
                  Telegram
                </a>
              )}
              {teacher.contacts?.facebook && (
                <a
                  href={teacher.contacts.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...contactPillStyle, background: "rgba(24, 119, 242, 0.12)", color: "#1877F2" }}
                >
                  Facebook
                </a>
              )}
              {teacher.contacts?.other?.link && (
                <a
                  href={teacher.contacts.other.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...contactPillStyle, background: "var(--bg-secondary)", color: "var(--text-primary)" }}
                >
                  {teacher.contacts.other.label || "តំណភ្ជាប់ផ្សេងៗ"}
                </a>
              )}
            </div>
          )}

          {/* Footer Action */}
          <div style={{ marginTop: "1.35rem", display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              className="btn"
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
              }}
            >
              បិទ
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(teacher);
                }}
                className="btn btn-primary"
                style={{ gap: "0.45rem" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span>{isOwnProfile ? "កែព័ត៌មានផ្ទាល់ខ្លួន" : "កែប្រែព័ត៌មាន"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function InfoItem({ label, value, href }: { label: string; value?: string; href?: string }) {
  return (
    <div>
      <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "0.15rem" }}>{label}</div>
      {href && value ? (
        <a href={href} style={{ fontSize: "0.94rem", fontWeight: 600, color: "var(--accent-primary)", textDecoration: "none" }}>
          {value}
        </a>
      ) : (
        <div style={{ fontSize: "0.94rem", fontWeight: 600, color: "var(--text-primary)", wordBreak: "break-word" }}>
          {value || "មិនមាន"}
        </div>
      )}
    </div>
  );
}

const tagStyle: React.CSSProperties = {
  padding: "0.28rem 0.65rem",
  borderRadius: "8px",
  fontSize: "0.82rem",
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  border: "1px solid var(--border-color)",
};

const contactPillStyle: React.CSSProperties = {
  padding: "0.45rem 0.9rem",
  borderRadius: "10px",
  fontSize: "0.85rem",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};
