import { useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import logoImotion from "@/assets/logo-imotion.png";

interface ProfessionalDocumentProps {
  content: string;
  documentName: string;
  projectName?: string;
  projectCode?: string;
  clientName?: string;
  clientCompany?: string;
  version?: number;
  date?: string;
  status?: string;
}

export function ProfessionalDocument({
  content,
  documentName,
  projectName,
  projectCode,
  clientName,
  clientCompany,
  version = 1,
  date,
  status,
}: ProfessionalDocumentProps) {
  const documentRef = useRef<HTMLDivElement>(null);

  const handleExportPDF = useCallback(async () => {
    if (!documentRef.current) return;

    const html2pdf = (await import("html2pdf.js")).default;

    const opt = {
      margin: [10, 12, 16, 12],
      filename: `${documentName.replace(/\s+/g, "_")}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait" as const,
      },
      pagebreak: { mode: ["avoid-all", "css", "legacy"] },
    };

    html2pdf().set(opt).from(documentRef.current).save();
  }, [documentName]);

  const currentDate = date || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter en PDF
        </button>
      </div>

      {/* Document container */}
      <div
        ref={documentRef}
        className="bg-white text-gray-900 shadow-lg rounded-lg overflow-hidden"
        style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}
      >
        {/* Header bar */}
        <div
          className="px-8 py-5 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, hsl(0 68% 51%), hsl(30 100% 49%))" }}
        >
          <div className="flex items-center gap-4">
            <img
              src={logoImotion}
              alt="IMOTION"
              className="h-10 w-auto"
              crossOrigin="anonymous"
            />
          </div>
          <div className="text-right text-white/90 text-xs">
            <p className="font-semibold text-white text-sm">{documentName}</p>
            {projectCode && <p>Ref. {projectCode}</p>}
            <p>{currentDate}</p>
          </div>
        </div>

        {/* Meta info bar */}
        <div className="px-8 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            {clientCompany && (
              <span>Client : <strong className="text-gray-700">{clientCompany}</strong></span>
            )}
            {clientName && !clientCompany && (
              <span>Client : <strong className="text-gray-700">{clientName}</strong></span>
            )}
            {projectName && (
              <span>Projet : <strong className="text-gray-700">{projectName}</strong></span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span>Version {version}</span>
            {status && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{
                  background: status === "signed" ? "#dcfce7" : status === "draft" ? "#f3f4f6" : "#fef3c7",
                  color: status === "signed" ? "#166534" : status === "draft" ? "#374151" : "#92400e",
                }}
              >
                {status === "draft" ? "Brouillon" : status === "signed" ? "Signé" : status === "sent" ? "Envoyé" : status}
              </span>
            )}
          </div>
        </div>

        {/* Document body */}
        <div className="px-8 py-8 md:px-12 md:py-10">
          <div className="imotion-document">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    color: "#1a1a1a",
                    borderBottom: "3px solid hsl(0 68% 51%)",
                    paddingBottom: "0.75rem",
                    marginTop: "2.5rem",
                    marginBottom: "1.25rem",
                  }}>
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 style={{
                    fontSize: "1.2rem",
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    color: "#2a2a2a",
                    borderLeft: "4px solid hsl(30 100% 49%)",
                    paddingLeft: "0.75rem",
                    marginTop: "2rem",
                    marginBottom: "1rem",
                  }}>
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 style={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                    color: "#333",
                    marginTop: "1.5rem",
                    marginBottom: "0.75rem",
                  }}>
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 style={{
                    fontSize: "0.95rem",
                    fontWeight: 600,
                    color: "#444",
                    marginTop: "1.25rem",
                    marginBottom: "0.5rem",
                  }}>
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    color: "#333",
                    marginBottom: "0.75rem",
                  }}>
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    color: "#333",
                    paddingLeft: "1.25rem",
                    marginBottom: "0.75rem",
                    listStyleType: "disc",
                  }}>
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol style={{
                    fontSize: "0.875rem",
                    lineHeight: 1.75,
                    color: "#333",
                    paddingLeft: "1.25rem",
                    marginBottom: "0.75rem",
                    listStyleType: "decimal",
                  }}>
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li style={{ marginBottom: "0.25rem" }}>{children}</li>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 600, color: "#1a1a1a" }}>{children}</strong>
                ),
                table: ({ children }) => (
                  <div style={{ overflowX: "auto", marginTop: "1rem", marginBottom: "1rem" }}>
                    <table style={{
                      width: "100%",
                      fontSize: "0.8rem",
                      borderCollapse: "collapse",
                      border: "1px solid #e5e7eb",
                    }}>
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead style={{ background: "linear-gradient(135deg, hsl(0 68% 51% / 0.08), hsl(30 100% 49% / 0.08))" }}>
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th style={{
                    padding: "0.6rem 0.75rem",
                    textAlign: "left",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    color: "#374151",
                    borderBottom: "2px solid hsl(0 68% 51% / 0.3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.025em",
                  }}>
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td style={{
                    padding: "0.5rem 0.75rem",
                    borderBottom: "1px solid #f3f4f6",
                    color: "#4b5563",
                  }}>
                    {children}
                  </td>
                ),
                blockquote: ({ children }) => (
                  <blockquote style={{
                    borderLeft: "4px solid hsl(30 100% 49%)",
                    background: "hsl(30 100% 49% / 0.05)",
                    padding: "0.75rem 1rem",
                    margin: "1rem 0",
                    borderRadius: "0 0.5rem 0.5rem 0",
                    fontSize: "0.875rem",
                    color: "#555",
                    fontStyle: "italic",
                  }}>
                    {children}
                  </blockquote>
                ),
                hr: () => (
                  <hr style={{
                    border: "none",
                    height: "1px",
                    background: "linear-gradient(90deg, transparent, hsl(0 68% 51% / 0.3), hsl(30 100% 49% / 0.3), transparent)",
                    margin: "2rem 0",
                  }} />
                ),
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  if (isBlock) {
                    return (
                      <pre style={{
                        background: "#1e1e1e",
                        color: "#d4d4d4",
                        padding: "1rem",
                        borderRadius: "0.5rem",
                        overflow: "auto",
                        fontSize: "0.8rem",
                        lineHeight: 1.6,
                        margin: "1rem 0",
                      }}>
                        <code>{children}</code>
                      </pre>
                    );
                  }
                  return (
                    <code style={{
                      background: "#f3f4f6",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.825rem",
                      color: "hsl(0 68% 51%)",
                    }}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-8 py-4 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400"
          style={{ background: "#fafafa" }}
        >
          <div className="flex items-center gap-2">
            <img src={logoImotion} alt="IMOTION" className="h-5 w-auto opacity-50" crossOrigin="anonymous" />
            <span>IMOTION - Agence Digitale</span>
          </div>
          <div className="text-right">
            <p>Document confidentiel - {currentDate}</p>
            <p>{documentName} - v{version}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
