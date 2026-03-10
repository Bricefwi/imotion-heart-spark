import { useRef, useCallback, useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import logoImotion from "@/assets/logo-imotion.png";
import { Loader2 } from "lucide-react";

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

// Extract TOC entries from markdown content
function extractTOC(markdown: string): { level: number; text: string; id: string }[] {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const entries: { level: number; text: string; id: string }[] = [];
  let match;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].replace(/[*_`]/g, "").trim();
    const id = text.toLowerCase().replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ]+/gi, "-").replace(/-+$/,"");
    entries.push({ level, text, id });
  }
  return entries;
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
  const [exporting, setExporting] = useState(false);

  const toc = useMemo(() => extractTOC(content), [content]);

  const currentDate = date || new Date().toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const handleExportPDF = useCallback(async () => {
    if (!documentRef.current || exporting) return;
    setExporting(true);

    try {
      const html2pdf = (await import("html2pdf.js")).default;

      // Clone the document element and add print-specific styles
      const element = documentRef.current;

      const opt = {
        margin: [28, 12, 22, 12] as [number, number, number, number],
        filename: `${documentName.replace(/\s+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
        },
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait" as const,
        },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };

      const worker = (html2pdf() as any).set(opt).from(element);

      // Generate PDF then add headers/footers on each page
      await worker.toPdf().get("pdf").then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          // --- Header ---
          // Gradient line
          pdf.setDrawColor(211, 47, 47); // primary red
          pdf.setLineWidth(0.8);
          pdf.line(12, 10, pageWidth - 12, 10);

          // Header left: document name
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          pdf.text(documentName, 12, 8);

          // Header right: ref + date
          const headerRight = `${projectCode ? "Ref. " + projectCode + " | " : ""}${currentDate}`;
          pdf.text(headerRight, pageWidth - 12, 8, { align: "right" });

          // --- Footer ---
          // Gradient line
          pdf.setDrawColor(245, 124, 0); // secondary orange
          pdf.setLineWidth(0.5);
          pdf.line(12, pageHeight - 14, pageWidth - 12, pageHeight - 14);

          // Footer left
          pdf.setFontSize(6.5);
          pdf.setTextColor(160, 160, 160);
          pdf.text("IMOTION - Agence Digitale | Document confidentiel", 12, pageHeight - 10);

          // Footer center: page number
          pdf.setFontSize(7);
          pdf.setTextColor(100, 100, 100);
          const pageText = `Page ${i} / ${totalPages}`;
          pdf.text(pageText, pageWidth / 2, pageHeight - 10, { align: "center" });

          // Footer right: version
          pdf.setFontSize(6.5);
          pdf.setTextColor(160, 160, 160);
          pdf.text(`v${version}`, pageWidth - 12, pageHeight - 10, { align: "right" });
        }
      }).save();
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  }, [documentName, projectCode, currentDate, version, exporting]);

  return (
    <div>
      {/* Export button */}
      <div className="flex justify-end mb-4 print:hidden">
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {exporting ? "Export en cours..." : "Exporter en PDF"}
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
            <img src={logoImotion} alt="IMOTION" className="h-10 w-auto" crossOrigin="anonymous" />
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
                {status === "draft" ? "Brouillon" : status === "signed" ? "Signe" : status === "sent" ? "Envoye" : status}
              </span>
            )}
          </div>
        </div>

        {/* Table of Contents */}
        {toc.length > 3 && (
          <div className="px-8 py-6 md:px-12 border-b border-gray-100">
            <h2 style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
              color: "#1a1a1a",
              marginBottom: "1rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}>
              Sommaire
            </h2>
            <div style={{ columns: toc.length > 12 ? 2 : 1, columnGap: "2rem" }}>
              {toc.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "0.5rem",
                    paddingLeft: entry.level === 2 ? "1.25rem" : entry.level === 3 ? "2.5rem" : "0",
                    marginBottom: entry.level === 1 ? "0.5rem" : "0.3rem",
                    breakInside: "avoid",
                  }}
                >
                  <span style={{
                    fontSize: entry.level === 1 ? "0.85rem" : "0.8rem",
                    fontWeight: entry.level === 1 ? 600 : 400,
                    color: entry.level === 1 ? "#1a1a1a" : "#555",
                    flex: 1,
                  }}>
                    {entry.text}
                  </span>
                  <span style={{
                    flex: "1 1 auto",
                    borderBottom: "1px dotted #ccc",
                    minWidth: "2rem",
                    height: "0.8em",
                  }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Document body */}
        <div className="px-8 py-8 md:px-12 md:py-10">
          <div className="imotion-document">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
                      color: "#1a1a1a",
                      borderBottom: "3px solid hsl(0 68% 51%)",
                      paddingBottom: "0.75rem",
                      marginTop: "2.5rem",
                      marginBottom: "1.25rem",
                      pageBreakAfter: "avoid",
                    }}
                  >
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
                    pageBreakAfter: "avoid",
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
                    pageBreakAfter: "avoid",
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
