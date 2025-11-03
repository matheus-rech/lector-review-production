import { useEffect, useMemo, useState } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
} from "@anaralabs/lector";

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

/** ---------- Types ---------- */
type Rect = { x: number; y: number; width: number; height: number };
type LabeledHighlight = Rect & { pageNumber: number; label: string; id: string; kind: "user" | "search" };
type PageTemplateField = { id: string; label: string; placeholder?: string };

/** ---------- Utilities ---------- */
const key = (project: string, name: string) => `proj:${project}:${name}`;
const uid = () => Math.random().toString(36).slice(2, 9);

/** Default per-page templates */
const DEFAULT_TEMPLATES: Record<number, PageTemplateField[]> = {
  1: [
    { id: "study_id", label: "Study ID" },
    { id: "design", label: "Design" }
  ],
  2: [
    { id: "n_total", label: "Total N" },
    { id: "arm_desc", label: "Arms (brief)" }
  ],
  3: [
    { id: "primary_outcome", label: "Primary Outcome" },
    { id: "effect", label: "Effect (e.g., OR, MD)" },
    { id: "ci", label: "95% CI" }
  ]
};

/** ---------- PDF Viewer Component (inside Root context) ---------- */
function PDFViewerContent({
  highlights,
  onAddHighlight,
  onJumpToPage,
  currentPage,
  totalPages,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number) => void;
  onJumpToPage: (page: number) => void;
  currentPage: number;
  totalPages: number;
}) {
  // Note: In a real implementation with Lector hooks, you would use:
  // const { jumpToPage, currentPage, totalPages } = usePdfJump();
  // const { searchTerm, setSearchTerm, results } = useSearch();
  // const { selectionRect } = useSelectionDimensions();
  
  // For now, we'll implement a simplified version without those hooks
  
  return (
    <Pages className="p-6">
      <Page>
        <CanvasLayer />
        <TextLayer />
      </Page>
    </Pages>
  );
}

/** ---------- Main App Component ---------- */
export default function App() {
  /** Projects */
  const [projects, setProjects] = useState<string[]>(() => {
    const raw = localStorage.getItem("projects");
    return raw ? JSON.parse(raw) : ["default"];
  });
  const [project, setProject] = useState<string>(() => {
    const raw = localStorage.getItem("current-project");
    return raw || "default";
  });

  useEffect(() => localStorage.setItem("projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("current-project", project), [project]);

  /** PDF source */
  const [source, setSource] = useState<string>("/sample.pdf");

  /** State */
  const [highlights, setHighlights] = useState<LabeledHighlight[]>([]);
  const [pageForm, setPageForm] = useState<Record<string, string>>({});
  const [pdfFormData, setPdfFormData] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /** Load persisted data */
  useEffect(() => {
    const h = localStorage.getItem(key(project, "highlights"));
    const pf = localStorage.getItem(key(project, "pageForm"));
    const tf = localStorage.getItem(key(project, "templates"));
    const pdf = localStorage.getItem(key(project, "pdfFormData"));

    setHighlights(h ? JSON.parse(h) : []);
    setPageForm(pf ? JSON.parse(pf) : {});
    setTemplates(tf ? JSON.parse(tf) : DEFAULT_TEMPLATES);
    setPdfFormData(pdf ? JSON.parse(pdf) : {});
  }, [project]);

  /** Persist data */
  useEffect(() => {
    localStorage.setItem(key(project, "highlights"), JSON.stringify(highlights));
  }, [project, highlights]);

  useEffect(() => {
    localStorage.setItem(key(project, "pageForm"), JSON.stringify(pageForm));
  }, [project, pageForm]);

  useEffect(() => {
    localStorage.setItem(key(project, "templates"), JSON.stringify(templates));
  }, [project, templates]);

  useEffect(() => {
    localStorage.setItem(key(project, "pdfFormData"), JSON.stringify(pdfFormData));
  }, [project, pdfFormData]);

  /** Actions */
  const addProject = () => {
    const name = prompt("New project name?");
    if (!name) return;
    if (projects.includes(name)) {
      alert("Project already exists.");
      return;
    }
    setProjects((p) => [...p, name]);
    setProject(name);
  };

  const deleteProject = () => {
    if (project === "default") {
      alert("Cannot delete the default project.");
      return;
    }
    if (!confirm(`Delete project "${project}"? This removes its local data.`)) return;
    ["highlights", "pageForm", "templates", "pdfFormData"].forEach((k) =>
      localStorage.removeItem(key(project, k))
    );
    setProjects((p) => p.filter((x) => x !== project));
    setProject("default");
  };

  const addHighlight = (rect: Rect, pageNumber: number) => {
    const label = prompt("Label for highlight (e.g., 'n', 'mean', 'CI')") || "label";
    setHighlights((prev) => [
      ...prev,
      { id: uid(), label, kind: "user", pageNumber, ...rect }
    ]);
  };

  const relabelHighlight = (id: string) => {
    const label = prompt("New label?");
    if (!label) return;
    setHighlights((prev) => prev.map((h) => (h.id === id ? { ...h, label } : h)));
  };

  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((h) => h.id !== id));
  };

  const handleTemplateInput = (fieldId: string, value: string, pageNo: number) => {
    setPageForm((prev) => ({ ...prev, [`${pageNo}:${fieldId}`]: value }));
  };

  const jumpToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /** Exporters */
  const exportJSON = () => {
    const payload = {
      project,
      pageForm,
      templates,
      pdfFormData,
      highlights,
      source
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    download(url, `${project}-extraction.json`);
  };

  const exportCSV = () => {
    const rows: string[] = [];
    rows.push("Project,Type,Page,Field,Label,Value,x,y,width,height");

    highlights
      .filter((h) => h.kind === "user")
      .forEach((h) => {
        rows.push([
          project, "Highlight", h.pageNumber, "", h.label, "",
          h.x, h.y, h.width, h.height
        ].join(","));
      });

    Object.entries(pageForm).forEach(([keyField, value]) => {
      const [p, fieldId] = keyField.split(":");
      rows.push([project, "PageField", p, fieldId, "", csvQuote(value), "", "", "", ""].join(","));
    });

    Object.entries(pdfFormData).forEach(([field, value]) => {
      rows.push([project, "PdfForm", "", field, "", csvQuote(value), "", "", "", ""].join(","));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    download(url, `${project}-extraction.csv`);
  };

  const download = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const csvQuote = (v: unknown) =>
    typeof v === "string" ? `"${v.replaceAll('"', '""')}"` : v ?? "";

  const currentPageTemplate: PageTemplateField[] = useMemo(
    () => templates[currentPage] || [],
    [templates, currentPage]
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar left */}
      <aside className="w-80 border-r p-3 space-y-4 bg-gray-50 overflow-y-auto">
        {/* Projects */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">Project</label>
          <div className="flex gap-2">
            <select
              className="w-full border p-1 rounded"
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <button onClick={addProject} className="px-2 border rounded">+</button>
            <button onClick={deleteProject} className="px-2 border rounded">🗑</button>
          </div>
        </div>

        {/* Source */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">PDF Source</label>
          <input
            className="w-full border p-1 rounded text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
          />
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Search</label>
          <input
            className="w-full border p-1 rounded"
            placeholder="Search in PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Export */}
        <div className="space-x-2">
          <button onClick={exportJSON} className="text-sm bg-green-200 px-2 py-1 rounded">
            Export JSON
          </button>
          <button onClick={exportCSV} className="text-sm bg-yellow-200 px-2 py-1 rounded">
            Export CSV
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 grid grid-cols-[1fr_340px]">
        {/* PDF Viewer */}
        <div className="overflow-hidden">
          <Root source={source} className="w-full h-screen">
            <PDFViewerContent
              highlights={highlights}
              onAddHighlight={addHighlight}
              onJumpToPage={jumpToPage}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </Root>
        </div>

        {/* Right sidebar */}
        <aside className="border-l p-3 space-y-4 bg-white overflow-y-auto">
          {/* Page Navigation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">Page</label>
            <div className="flex items-center gap-2">
              <button className="px-2 border rounded" onClick={() => jumpToPage(currentPage - 1)}>
                ◀
              </button>
              <span className="text-sm">{currentPage} / {totalPages}</span>
              <button className="px-2 border rounded" onClick={() => jumpToPage(currentPage + 1)}>
                ▶
              </button>
            </div>
          </div>

          {/* Per-Page Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Fields for page {currentPage}</h3>
              <button
                className="text-xs px-2 border rounded"
                onClick={() => {
                  const lbl = prompt("Add field (label)?");
                  if (!lbl) return;
                  const id = lbl.toLowerCase().replace(/\W+/g, "_");
                  setTemplates((prev) => ({
                    ...prev,
                    [currentPage]: [...(prev[currentPage] || []), { id, label: lbl }]
                  }));
                }}
              >
                + field
              </button>
            </div>

            {currentPageTemplate.length === 0 && (
              <div className="text-xs text-gray-500">No fields for this page.</div>
            )}

            <div className="space-y-2">
              {currentPageTemplate.map((f) => {
                const keyField = `${currentPage}:${f.id}`;
                return (
                  <div key={f.id} className="space-y-1">
                    <label className="text-xs">{f.label}</label>
                    <input
                      className="w-full border p-1 rounded text-sm"
                      placeholder={f.placeholder || ""}
                      value={pageForm[keyField] || ""}
                      onChange={(e) => handleTemplateInput(f.id, e.target.value, currentPage)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Your Highlights</h3>
            <ul className="text-sm divide-y max-h-56 overflow-auto">
              {highlights.length === 0 && (
                <li className="text-xs text-gray-500 py-2">No highlights yet.</li>
              )}
              {highlights.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-xs">{h.label}</div>
                    <div className="text-xs text-gray-500">p.{h.pageNumber}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="px-2 text-xs border rounded"
                      onClick={() => jumpToPage(h.pageNumber)}
                    >
                      Go
                    </button>
                    <button
                      className="px-2 text-xs border rounded"
                      onClick={() => relabelHighlight(h.id)}
                    >
                      Edit
                    </button>
                    <button
                      className="px-2 text-xs border rounded"
                      onClick={() => deleteHighlight(h.id)}
                    >
                      Del
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
