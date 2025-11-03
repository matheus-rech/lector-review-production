import { useEffect, useMemo, useState } from "react";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  HighlightLayer,
  AnnotationLayer,
  usePdfJump,
  useSearch,
  useSelectionDimensions,
} from "@anaralabs/lector";

/** ---------- Types ---------- */
type Rect = { x: number; y: number; width: number; height: number };
type LabeledHighlight = Rect & { pageNumber: number; label: string; id: string; kind: "user" | "search" };
type PageTemplateField = { id: string; label: string; placeholder?: string };

/** ---------- Utilities ---------- */
// Stable localStorage keys per project
const key = (project: string, name: string) => `proj:${project}:${name}`;
const uid = () => Math.random().toString(36).slice(2, 9);

/** Default per-page templates (customize freely) */
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

/** ---------- Component ---------- */
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

  // Persist project list / current project
  useEffect(() => localStorage.setItem("projects", JSON.stringify(projects)), [projects]);
  useEffect(() => localStorage.setItem("current-project", project), [project]);

  /** PDF source (you can swap to your own) */
  const [source, setSource] = useState<string>("/sample.pdf");

  /** Lector hooks */
  const { jumpToPage, currentPage, totalPages } = usePdfJump();
  const { searchTerm, setSearchTerm, results, jumpToResult, currentResultIndex } = useSearch();
  const { selectionRect } = useSelectionDimensions();

  /** Persistent state (namespaced per project) */
  // User highlights with labels
  const [highlights, setHighlights] = useState<LabeledHighlight[]>([]);
  // Search highlights are derived (not persisted)
  const searchHighlights: LabeledHighlight[] = useMemo(() => {
    // Map search results to highlight rects (auto-highlighting)
    // Assumes `results` items exposing { pageNumber, rect } or { pageNumber, rects[] }.
    const out: LabeledHighlight[] = [];
    results.forEach((r: any, idx: number) => {
      if (r?.rect) {
        out.push({ ...r.rect, pageNumber: r.pageNumber, label: `hit #${idx + 1}`, id: `s_${idx}`, kind: "search" });
      } else if (Array.isArray(r?.rects)) {
        r.rects.forEach((rect: Rect, j: number) => {
          out.push({ ...rect, pageNumber: r.pageNumber, label: `hit #${idx + 1}.${j + 1}`, id: `s_${idx}_${j}`, kind: "search" });
        });
      }
    });
    return out;
  }, [results]);

  // Form data per page for per-page templates
  const [pageForm, setPageForm] = useState<Record<string, string>>({});
  // Embedded PDF form capture (from AnnotationLayer)
  const [pdfFormData, setPdfFormData] = useState<Record<string, string>>({});
  // Per-project templates (you can edit in UI later if you want)
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);

  /** Load persisted (per project) */
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

  /** Persist (per project) */
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
    // cleanup keys
    ["highlights", "pageForm", "templates", "pdfFormData"].forEach((k) =>
      localStorage.removeItem(key(project, k))
    );
    setProjects((p) => p.filter((x) => x !== project));
    setProject("default");
  };

  const addHighlight = () => {
    if (!selectionRect) return;
    const label = prompt("Label for highlight (e.g., 'n', 'mean', 'CI')") || "label";
    setHighlights((prev) => [
      ...prev,
      { id: uid(), label, kind: "user", pageNumber: currentPage || 1, ...selectionRect }
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
    // key per page field: `${page}:{fieldId}`
    setPageForm((prev) => ({ ...prev, [`${pageNo}:${fieldId}`]: value }));
  };

  const handlePdfFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const entries = Object.fromEntries(data.entries());
    setPdfFormData(entries as Record<string, string>);
    alert("Embedded PDF form data saved locally.");
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

    // Labeled user highlights
    highlights
      .filter((h) => h.kind === "user")
      .forEach((h) => {
        rows.push([
          project, "Highlight", h.pageNumber, "", h.label, "",
          h.x, h.y, h.width, h.height
        ].join(","));
      });

    // Per-page template fields
    Object.entries(pageForm).forEach(([keyField, value]) => {
      const [p, fieldId] = keyField.split(":");
      rows.push([project, "PageField", p, fieldId, "", csvQuote(value), "", "", "", ""].join(","));
    });

    // Embedded PDF forms
    Object.entries(pdfFormData).forEach(([field, value]) => {
      rows.push([project, "PdfForm", "", field, "", csvQuote(value), "", "", "", ""].join(","));
    });

    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    download(url, `${project}-extraction.csv`);
  };

  const download = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const csvQuote = (v: unknown) =>
    typeof v === "string" ? `"${v.replaceAll('"', '""')}"` : v ?? "";

  /** Combined highlights (user + auto search) */
  const combinedHighlights = useMemo<LabeledHighlight[]>(
    () => [...highlights, ...searchHighlights],
    [highlights, searchHighlights]
  );

  /** Current page template */
  const currentPageTemplate: PageTemplateField[] = useMemo(
    () => templates[currentPage ?? 1] || [],
    [templates, currentPage]
  );

  return (
    <div className="flex h-screen">
      {/* Sidebar left: Project + Search + Export */}
      <aside className="w-80 border-r p-3 space-y-4 bg-gray-50 dark:bg-gray-900">
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
            <button onClick={addProject} className="px-2 border rounded">＋</button>
            <button onClick={deleteProject} className="px-2 border rounded">🗑</button>
          </div>
        </div>

        {/* Source (optional change) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">PDF Source</label>
          <input
            className="w-full border p-1 rounded"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            title="You can point to a PDF URL you host (e.g., /sample.pdf)"
          />
        </div>

        {/* Search (auto-highlights + jump) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Search</label>
          <div className="flex gap-2">
            <input
              className="w-full border p-1 rounded"
              placeholder="e.g., odds ratio"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="px-2 border rounded" onClick={() => jumpToResult(currentResultIndex - 1)}>◀</button>
            <button className="px-2 border rounded" onClick={() => jumpToResult(currentResultIndex + 1)}>▶</button>
          </div>
          <div className="text-xs text-gray-600">
            {results.length} hits {results.length ? `• at #${currentResultIndex + 1}` : ""}
          </div>
        </div>

        {/* Export */}
        <div className="space-x-2">
          <button onClick={exportJSON} className="text-sm bg-green-200 px-2 py-1 rounded">Export JSON</button>
          <button onClick={exportCSV} className="text-sm bg-yellow-200 px-2 py-1 rounded">Export CSV</button>
        </div>
      </aside>

      {/* Viewer + Right sidebar */}
      <main className="flex-1 grid grid-cols-[1fr_340px]">
        {/* PDF Viewer */}
        <div className="overflow-hidden">
          <Root source={source} className="w-full h-screen">
            <Pages className="p-6">
              <Page>
                <CanvasLayer />
                <TextLayer />
                {/* Combined user + search highlights */}
                <HighlightLayer highlights={combinedHighlights} />
                {/* Embedded PDF forms capture */}
                <AnnotationLayer onSubmit={handlePdfFormSubmit} />
              </Page>
            </Pages>
          </Root>
        </div>

        {/* Right sidebar: Per-page fields + Nav + User highlights */}
        <aside className="border-l p-3 space-y-4 bg-white dark:bg-zinc-900">
          {/* Page Navigation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">Page</label>
            <div className="flex items-center gap-2">
              <button className="px-2 border rounded" onClick={() => jumpToPage((currentPage ?? 1) - 1)}>◀</button>
              <span>{currentPage || 1} / {totalPages || 1}</span>
              <button className="px-2 border rounded" onClick={() => jumpToPage((currentPage ?? 1) + 1)}>▶</button>
            </div>
          </div>

          {/* Per-Page Field Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Fields for page {currentPage || 1}</h3>
              <button
                className="text-xs px-2 border rounded"
                onClick={() => {
                  const lbl = prompt("Add field (label)?");
                  if (!lbl) return;
                  const id = lbl.toLowerCase().replace(/\W+/g, "_");
                  const p = currentPage || 1;
                  setTemplates((prev) => ({
                    ...prev,
                    [p]: [...(prev[p] || []), { id, label: lbl }]
                  }));
                }}
              >
                + field
              </button>
            </div>

            {currentPageTemplate.length === 0 && (
              <div className="text-xs text-gray-500">No fields defined for this page.</div>
            )}

            <div className="space-y-2">
              {currentPageTemplate.map((f) => {
                const keyField = `${currentPage || 1}:${f.id}`;
                return (
                  <div key={f.id} className="space-y-1">
                    <label className="text-xs">{f.label}</label>
                    <input
                      className="w-full border p-1 rounded"
                      placeholder={f.placeholder || ""}
                      value={pageForm[keyField] || ""}
                      onChange={(e) => handleTemplateInput(f.id, e.target.value, currentPage || 1)}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Highlights (label + edit + delete) */}
          <div className="space-y-2">
            <h3 className="font-semibold">Your Highlights</h3>
            <div className="flex gap-2">
              <button className="text-sm bg-blue-200 px-2 rounded" onClick={addHighlight}>Add from Selection</button>
            </div>
            <ul className="text-sm divide-y max-h-56 overflow-auto">
              {highlights.length === 0 && <li className="text-xs text-gray-500 py-2">No highlights yet.</li>}
              {highlights.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{h.label}</div>
                    <div className="text-xs text-gray-500">p.{h.pageNumber}</div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-2 text-xs border rounded" onClick={() => jumpToPage(h.pageNumber)}>Go</button>
                    <button className="px-2 text-xs border rounded" onClick={() => relabelHighlight(h.id)}>Rename</button>
                    <button className="px-2 text-xs border rounded" onClick={() => deleteHighlight(h.id)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Embedded PDF form submit */}
          <div className="space-y-1">
            <h3 className="font-semibold">Embedded PDF Forms</h3>
            <p className="text-xs text-gray-500">
              If this PDF contains AcroForm fields, they will be submittable from the viewer.
              Click inside the PDF fields, then submit here:
            </p>
            <form onSubmit={handlePdfFormSubmit}>
              <button className="mt-2 text-sm bg-emerald-200 px-2 py-1 rounded" type="submit">Save PDF Form Values</button>
            </form>
          </div>
        </aside>
      </main>
    </div>
  );
}
