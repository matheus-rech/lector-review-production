import { useEffect, useMemo, useState, useCallback } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  ColoredHighlightLayer,
  useSelectionDimensions,
  usePdfJump,
  useSearch,
  type ColoredHighlight,
} from "@anaralabs/lector";

// Configure PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

/** ---------- Types ---------- */
type Rect = { x: number; y: number; width: number; height: number };
type LabeledHighlight = {
  id: string;
  label: string;
  kind: "user" | "search";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
};
type FieldTemplate = { id: string; label: string; placeholder?: string };

/** ---------- Utility ---------- */
let uidCounter = 0;
const uid = () => `h${++uidCounter}`;

/** ---------- Default Templates for Systematic Review ---------- */
const defaultTemplates: Record<number, FieldTemplate[]> = {
  1: [
    { id: "study_id", label: "Study ID (DOI/PMID)", placeholder: "e.g., 10.1161/STROKEAHA.116.014078" },
    { id: "first_author", label: "First Author", placeholder: "e.g., Kim" },
    { id: "year", label: "Year of Publication", placeholder: "e.g., 2016" },
    { id: "country", label: "Country", placeholder: "e.g., Korea" }
  ],
  2: [
    { id: "research_question", label: "Research Question", placeholder: "Primary research question" },
    { id: "study_design", label: "Study Design", placeholder: "e.g., Retrospective-Matched Case-Control" },
    { id: "control_definition", label: "Control Group Definition", placeholder: "How was control defined?" }
  ],
  3: [
    { id: "total_patients", label: "Total Patients (N)", placeholder: "e.g., 112" },
    { id: "intervention_size", label: "Intervention Group Size", placeholder: "e.g., 28" },
    { id: "control_size", label: "Control Group Size", placeholder: "e.g., 56" }
  ],
  4: [
    { id: "age_mean", label: "Age (Mean ± SD)", placeholder: "e.g., 59.0 ± 11.6" },
    { id: "gender_male_pct", label: "Gender (% Male)", placeholder: "e.g., 64.3%" },
    { id: "baseline_status", label: "Baseline Neurological Status", placeholder: "e.g., GCS score, NIHSS" }
  ],
  5: [
    { id: "primary_outcome", label: "Primary Outcome", placeholder: "e.g., mRS 0-2 at 12 months" },
    { id: "effect_measure", label: "Effect Measure (OR/RR/HR)", placeholder: "e.g., OR 4.815" },
    { id: "confidence_interval", label: "95% CI", placeholder: "e.g., [1.45, 3.78]" },
    { id: "p_value", label: "P-value", placeholder: "e.g., 0.009" }
  ]
};

/** ---------- PDF Viewer Component (inside Root context) ---------- */
function PDFViewerContent({
  highlights,
  onAddHighlight,
  searchTerm,
  onSearchResultsChange,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number, label: string) => void;
  searchTerm: string;
  onSearchResultsChange: (count: number) => void;
}) {
  // Use Lector hooks
  const selectionDimensions = useSelectionDimensions();
  const { currentPageNumber } = usePdfJump();
  const { searchResults, findExactMatches } = useSearch();
  
  // State for pending selection
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  
  // Perform search when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      findExactMatches({ searchText: searchTerm });
    }
  }, [searchTerm, findExactMatches]);
  
  // Update search results count
  useEffect(() => {
    if (searchResults?.exactMatches) {
      onSearchResultsChange(searchResults.exactMatches.length);
    } else {
      onSearchResultsChange(0);
    }
  }, [searchResults, onSearchResultsChange]);
  
  // Handle text selection - store pending selection
  useEffect(() => {
    if (selectionDimensions && selectionDimensions.rects && selectionDimensions.rects.length > 0) {
      setPendingSelection({
        rects: selectionDimensions.rects,
        pageNumber: currentPageNumber || 1,
        text: selectionDimensions.text || ""
      });
    }
  }, [selectionDimensions, currentPageNumber]);
  
  // Handle highlight creation from pending selection
  const createHighlightFromSelection = useCallback(() => {
    if (pendingSelection) {
      const label = prompt("Enter highlight label:", pendingSelection.text.substring(0, 50));
      if (label) {
        const rect = pendingSelection.rects[0];
        onAddHighlight(rect, pendingSelection.pageNumber, label);
      }
      setPendingSelection(null);
    }
  }, [pendingSelection, onAddHighlight]);
  
  // Convert our highlights to ColoredHighlight format
  const coloredHighlights: ColoredHighlight[] = highlights.map((h) => ({
    id: h.id,
    pageNumber: h.pageNumber,
    rects: [{
      x: h.x,
      y: h.y,
      width: h.width,
      height: h.height,
    }],
    color: h.kind === "search" ? "rgba(255, 255, 0, 0.4)" : "rgba(0, 255, 0, 0.3)",
  }));
  
  return (
    <div className="relative w-full h-full">
      <Pages className="p-6">
        <Page>
          <CanvasLayer />
          <TextLayer />
          <ColoredHighlightLayer highlights={coloredHighlights} />
        </Page>
      </Pages>
      
      {/* Floating "Highlight Selection" button */}
      {pendingSelection && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            onClick={createHighlightFromSelection}
            className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
          >
            📝 Highlight Selected Text
          </button>
          <button
            onClick={() => setPendingSelection(null)}
            className="ml-2 px-3 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

/** ---------- Main App Component ---------- */
export default function App() {
  /** Projects */
  const [projects, setProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem("projects");
    return saved ? JSON.parse(saved) : ["default"];
  });
  const [currentProject, setCurrentProject] = useState("default");

  /** PDF Source */
  const [source, setSource] = useState("/Kim2016.pdf");

  /** Search */
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResultCount, setSearchResultCount] = useState(0);

  /** Highlights */
  const [highlights, setHighlights] = useState<LabeledHighlight[]>(() => {
    const saved = localStorage.getItem(`proj:${currentProject}:highlights`);
    return saved ? JSON.parse(saved) : [];
  });

  /** Field Templates */
  const [templates, setTemplates] = useState<Record<number, FieldTemplate[]>>(() => {
    const saved = localStorage.getItem(`proj:${currentProject}:templates`);
    return saved ? JSON.parse(saved) : defaultTemplates;
  });

  /** Page Form Data */
  const [pageForm, setPageForm] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`proj:${currentProject}:pageForm`);
    return saved ? JSON.parse(saved) : {};
  });

  /** Page Navigation */
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(9); // Kim2016.pdf has 9 pages

  /** Save to localStorage */
  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(`proj:${currentProject}:highlights`, JSON.stringify(highlights));
  }, [currentProject, highlights]);

  useEffect(() => {
    localStorage.setItem(`proj:${currentProject}:templates`, JSON.stringify(templates));
  }, [currentProject, templates]);

  useEffect(() => {
    localStorage.setItem(`proj:${currentProject}:pageForm`, JSON.stringify(pageForm));
  }, [currentProject, pageForm]);

  /** Switch project */
  const switchProject = (proj: string) => {
    setCurrentProject(proj);
    const savedHighlights = localStorage.getItem(`proj:${proj}:highlights`);
    setHighlights(savedHighlights ? JSON.parse(savedHighlights) : []);
    const savedTemplates = localStorage.getItem(`proj:${proj}:templates`);
    setTemplates(savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates);
    const savedForm = localStorage.getItem(`proj:${proj}:pageForm`);
    setPageForm(savedForm ? JSON.parse(savedForm) : {});
  };

  /** Add/Delete projects */
  const addProject = () => {
    const name = prompt("New project name?");
    if (name && !projects.includes(name)) {
      setProjects([...projects, name]);
      switchProject(name);
    }
  };

  const deleteProject = () => {
    if (currentProject === "default") {
      alert("Cannot delete default project");
      return;
    }
    if (confirm(`Delete project "${currentProject}"?`)) {
      const newProjects = projects.filter((p) => p !== currentProject);
      setProjects(newProjects);
      localStorage.removeItem(`proj:${currentProject}:highlights`);
      localStorage.removeItem(`proj:${currentProject}:templates`);
      localStorage.removeItem(`proj:${currentProject}:pageForm`);
      switchProject("default");
    }
  };

  /** Add highlight */
  const addHighlight = (rect: Rect, pageNumber: number, label: string) => {
    const newHighlight: LabeledHighlight = {
      id: uid(),
      label,
      kind: "user",
      pageNumber,
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
    };
    setHighlights((prev) => [...prev, newHighlight]);
  };

  /** Relabel highlight */
  const relabelHighlight = (id: string) => {
    const h = highlights.find((x) => x.id === id);
    if (!h) return;
    const newLabel = prompt("New label?", h.label);
    if (newLabel) {
      setHighlights((prev) =>
        prev.map((x) => (x.id === id ? { ...x, label: newLabel } : x))
      );
    }
  };

  /** Delete highlight */
  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
  };

  /** Jump to page */
  const jumpToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  /** Template input */
  const currentPageTemplate = templates[currentPage] || [];
  const handleTemplateInput = (fieldId: string, value: string, page: number) => {
    const key = `${page}:${fieldId}`;
    setPageForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Export JSON */
  const exportJSON = () => {
    const data = {
      project: currentProject,
      source,
      highlights,
      templates,
      pageForm,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject}_export_${Date.now()}.json`;
    a.click();
  };

  /** Export CSV */
  const exportCSV = () => {
    const rows = [
      ["Project", "Page", "Field", "Value", "Highlight Label", "Highlight Page"],
    ];
    Object.entries(pageForm).forEach(([key, value]) => {
      const [page, field] = key.split(":");
      rows.push([currentProject, page, field, value, "", ""]);
    });
    highlights.forEach((h) => {
      rows.push([currentProject, "", "", "", h.label, String(h.pageNumber)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject}_export_${Date.now()}.csv`;
    a.click();
  };

  /** Convert search results to highlights */
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      // Remove old search highlights
      setHighlights((prev) => prev.filter((h) => h.kind !== "search"));
      
      // Note: Search results from useSearch need to be converted to highlights
      // This requires accessing the searchResults from the PDFViewerContent
      // For now, we'll keep the infrastructure ready
    } else {
      // Clear search highlights when search is cleared
      setHighlights((prev) => prev.filter((h) => h.kind !== "search"));
    }
  }, [searchTerm]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar */}
      <aside className="w-64 border-r p-3 space-y-4 bg-white overflow-y-auto">
        {/* Project selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Project</label>
          <div className="flex items-center gap-1">
            <select
              className="flex-1 border p-1 rounded text-sm"
              value={currentProject}
              onChange={(e) => switchProject(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button className="px-2 border rounded" onClick={addProject}>
              +
            </button>
            <button className="px-2 border rounded" onClick={deleteProject}>
              🗑
            </button>
          </div>
        </div>

        {/* PDF Source */}
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
            className="w-full border p-1 rounded text-sm"
            placeholder="Search in PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchResultCount > 0 && (
            <div className="text-xs text-gray-600">
              Found {searchResultCount} match{searchResultCount !== 1 ? 'es' : ''}
            </div>
          )}
        </div>

        {/* Export */}
        <div className="space-x-2">
          <button onClick={exportJSON} className="text-sm bg-green-200 px-2 py-1 rounded">
            Export JSON
          </button>
          <button onClick={exportCSV} className="text-sm bg-red-200 px-2 py-1 rounded">
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
              searchTerm={searchTerm}
              onSearchResultsChange={setSearchResultCount}
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
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Your Highlights</h3>
            </div>
            <ul className="text-sm divide-y max-h-56 overflow-auto">
              {highlights.length === 0 && (
                <li className="text-xs text-gray-500 py-2">No highlights yet. Select text in the PDF to create highlights.</li>
              )}
              {highlights.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-xs flex items-center gap-2">
                      <span className={`w-3 h-3 rounded ${h.kind === 'search' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                      {h.label}
                    </div>
                    <div className="text-xs text-gray-500">p.{h.pageNumber}</div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="px-2 text-xs border rounded"
                      onClick={() => jumpToPage(h.pageNumber)}
                    >
                      Go
                    </button>
                    {h.kind === "user" && (
                      <>
                        <button
                          className="px-2 text-xs border rounded"
                          onClick={() => relabelHighlight(h.id)}
                        >
                          ✏
                        </button>
                        <button
                          className="px-2 text-xs border rounded"
                          onClick={() => deleteHighlight(h.id)}
                        >
                          ✕
                        </button>
                      </>
                    )}
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
