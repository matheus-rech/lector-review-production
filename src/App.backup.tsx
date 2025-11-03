import { useState, useEffect, useCallback } from "react";
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
import { useDebounce } from "./hooks/useDebounce";
import { Toast, useToast } from "./components/Toast";
import { InputModal, ConfirmModal } from "./components/Modal";

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
  onUpdateSearchHighlights,
  onSearchError,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number, label: string) => void;
  searchTerm: string;
  onSearchResultsChange: (count: number) => void;
  onUpdateSearchHighlights: (searchHighlights: LabeledHighlight[]) => void;
  onSearchError: (error: string) => void;
}) {
  // Use Lector hooks
  const selectionDimensions = useSelectionDimensions();
  const { currentPageNumber } = usePdfJump();
  const { searchResults, findExactMatches } = useSearch();
  
  // State for pending selection
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  
  // Debounce search term to avoid performance issues
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  
  // Perform search when debouncedSearchTerm changes
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length > 0) {
      try {
        findExactMatches({ searchText: debouncedSearchTerm });
      } catch (error) {
        console.error('Search error:', error);
        onSearchError('Search failed. Please try again.');
      }
    } else {
      onSearchResultsChange(0);
      onUpdateSearchHighlights([]);
    }
  }, [debouncedSearchTerm, findExactMatches, onSearchResultsChange, onUpdateSearchHighlights, onSearchError]);
  
  // Convert search results to highlights and update count
  useEffect(() => {
    if (searchResults?.exactMatches && searchResults.exactMatches.length > 0) {
      onSearchResultsChange(searchResults.exactMatches.length);
      
      // Convert search results to highlight format
      const searchHighlights: LabeledHighlight[] = searchResults.exactMatches.map((match: any, index: number) => {
        // Extract rect from match - the structure may vary
        const rect = match.rects && match.rects[0] ? match.rects[0] : 
                     match.rect ? match.rect :
                     { x: 100, y: 100, width: 200, height: 20 }; // fallback
        
        return {
          id: `search-${index}-${Date.now()}`,
          label: `Search: "${debouncedSearchTerm}"`,
          kind: "search" as const,
          pageNumber: match.pageNumber || 1,
          x: rect.x || 0,
          y: rect.y || 0,
          width: rect.width || 200,
          height: rect.height || 20,
        };
      });
      
      // Update parent component's highlights via callback
      onUpdateSearchHighlights(searchHighlights);
    } else if (debouncedSearchTerm && debouncedSearchTerm.trim().length > 0) {
      onSearchResultsChange(0);
      onUpdateSearchHighlights([]);
    }
  }, [searchResults, debouncedSearchTerm, onSearchResultsChange, onUpdateSearchHighlights]);
  
  // Handle text selection - store pending selection
  useEffect(() => {
    if (selectionDimensions && selectionDimensions.rects && selectionDimensions.rects.length > 0) {
      setPendingSelection({
        rects: selectionDimensions.rects,
        pageNumber: currentPageNumber || 1,
        text: selectionDimensions.text || ""
      });
    } else {
      setPendingSelection(null);
    }
  }, [selectionDimensions, currentPageNumber]);
  
  // Handle highlight button click
  const handleHighlightClick = () => {
    if (!pendingSelection) return;
    const label = prompt("Label for this highlight?");
    if (label) {
      const rect = pendingSelection.rects[0];
      onAddHighlight(rect, pendingSelection.pageNumber, label);
      setPendingSelection(null);
    }
  };

  // Convert highlights to Lector format
  const lectorHighlights: ColoredHighlight[] = highlights.map((h) => ({
    pageNumber: h.pageNumber,
    x: h.x,
    y: h.y,
    width: h.width,
    height: h.height,
    color: h.kind === "search" ? "rgba(255, 255, 0, 0.3)" : "rgba(59, 130, 246, 0.3)",
  }));

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Pages>
        <Page>
          <CanvasLayer />
          <TextLayer />
          <ColoredHighlightLayer highlights={lectorHighlights} />
        </Page>
      </Pages>
      
      {/* Floating highlight button */}
      {pendingSelection && (
        <button
          onClick={handleHighlightClick}
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 16px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            fontSize: "14px",
            fontWeight: "500",
            zIndex: 1000,
          }}
        >
          📝 Highlight Selected Text
        </button>
      )}
    </div>
  );
}

/** ---------- Main App Component ---------- */
export default function App() {
  // Toast notifications
  const toast = useToast();
  
  // Modal states
  const [addProjectModal, setAddProjectModal] = useState(false);
  const [deleteProjectModal, setDeleteProjectModal] = useState(false);
  const [relabelModal, setRelabelModal] = useState<{ isOpen: boolean; highlightId: string | null }>({
    isOpen: false,
    highlightId: null,
  });
  const [addFieldModal, setAddFieldModal] = useState(false);
  
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
    toast.success(`Switched to project: ${proj}`);
  };

  /** Add/Delete projects */
  const addProject = (name: string) => {
    if (name && !projects.includes(name)) {
      setProjects([...projects, name]);
      switchProject(name);
      toast.success(`Project "${name}" created successfully`);
    } else if (projects.includes(name)) {
      toast.error(`Project "${name}" already exists`);
    }
  };

  const deleteProject = () => {
    if (currentProject === "default") {
      toast.error("Cannot delete default project");
      return;
    }
    const newProjects = projects.filter((p) => p !== currentProject);
    setProjects(newProjects);
    localStorage.removeItem(`proj:${currentProject}:highlights`);
    localStorage.removeItem(`proj:${currentProject}:templates`);
    localStorage.removeItem(`proj:${currentProject}:pageForm`);
    toast.success(`Project "${currentProject}" deleted`);
    switchProject("default");
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
    toast.success(`Highlight "${label}" added`);
  };

  /** Relabel highlight */
  const relabelHighlight = (id: string, newLabel: string) => {
    const h = highlights.find((x) => x.id === id);
    if (!h) return;
    if (newLabel) {
      setHighlights((prev) =>
        prev.map((x) => (x.id === id ? { ...x, label: newLabel } : x))
      );
      toast.success(`Highlight relabeled to "${newLabel}"`);
    }
  };

  /** Delete highlight */
  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
    toast.success("Highlight deleted");
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

  /** Add custom field */
  const addCustomField = (label: string) => {
    if (!label) return;
    const newField: FieldTemplate = {
      id: `custom_${Date.now()}`,
      label,
      placeholder: "",
    };
    setTemplates((prev) => ({
      ...prev,
      [currentPage]: [...(prev[currentPage] || []), newField],
    }));
    toast.success(`Field "${label}" added to page ${currentPage}`);
  };

  /** Export JSON */
  const exportJSON = () => {
    try {
      const data = {
        project: currentProject,
        source,
        highlights,
        templates,
        pageForm,
        exportedAt: new Date().toISOString(),
      };
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentProject}_export_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("JSON exported successfully");
    } catch (error) {
      console.error('Export JSON error:', error);
      toast.error("Failed to export JSON");
    }
  };

  /** Export CSV */
  const exportCSV = () => {
    try {
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
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported successfully");
    } catch (error) {
      console.error('Export CSV error:', error);
      toast.error("Failed to export CSV");
    }
  };

  /** Handle search highlights from PDFViewerContent */
  const handleSearchHighlights = useCallback((searchHighlights: LabeledHighlight[]) => {
    setHighlights((prev) => {
      const userHighlights = prev.filter((h) => h.kind !== "search");
      return [...userHighlights, ...searchHighlights];
    });
  }, []);
  
  /** Clear search highlights when search is cleared */
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length === 0) {
      setHighlights((prev) => prev.filter((h) => h.kind !== "search"));
      setSearchResultCount(0);
    }
  }, [searchTerm]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toast notifications */}
      <Toast toasts={toast.toasts} onRemove={toast.removeToast} />
      
      {/* Modals */}
      <InputModal
        isOpen={addProjectModal}
        onClose={() => setAddProjectModal(false)}
        title="Create New Project"
        message="Enter a name for the new project:"
        placeholder="e.g., Study 2024"
        onConfirm={addProject}
        confirmText="Create"
      />
      
      <ConfirmModal
        isOpen={deleteProjectModal}
        onClose={() => setDeleteProjectModal(false)}
        title="Delete Project"
        message={`Are you sure you want to delete project "${currentProject}"? This action cannot be undone.`}
        onConfirm={deleteProject}
        confirmText="Delete"
        type="danger"
      />
      
      <InputModal
        isOpen={relabelModal.isOpen}
        onClose={() => setRelabelModal({ isOpen: false, highlightId: null })}
        title="Relabel Highlight"
        message="Enter a new label for this highlight:"
        defaultValue={
          relabelModal.highlightId
            ? highlights.find((h) => h.id === relabelModal.highlightId)?.label || ""
            : ""
        }
        onConfirm={(newLabel) => {
          if (relabelModal.highlightId) {
            relabelHighlight(relabelModal.highlightId, newLabel);
          }
        }}
        confirmText="Update"
      />
      
      <InputModal
        isOpen={addFieldModal}
        onClose={() => setAddFieldModal(false)}
        title="Add Custom Field"
        message={`Add a custom field to page ${currentPage}:`}
        placeholder="e.g., Follow-up Duration"
        onConfirm={addCustomField}
        confirmText="Add"
      />
      
      {/* Left sidebar */}
      <aside className="w-64 border-r p-3 space-y-4 bg-white overflow-y-auto">
        {/* Project selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Project</label>
          <div className="flex gap-1">
            <select
              className="flex-1 border rounded px-2 py-1 text-sm"
              value={currentProject}
              onChange={(e) => switchProject(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              className="px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              onClick={() => setAddProjectModal(true)}
              title="Create new project"
            >
              +
            </button>
            <button
              className="px-2 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              onClick={() => {
                if (currentProject === "default") {
                  toast.error("Cannot delete default project");
                } else {
                  setDeleteProjectModal(true);
                }
              }}
              title="Delete current project"
            >
              🗑
            </button>
          </div>
        </div>

        {/* PDF Source */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">PDF Source</label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="/path/to/pdf"
          />
        </div>

        {/* Search */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">
            Search {searchResultCount > 0 && `(${searchResultCount} results)`}
          </label>
          <input
            className="w-full border rounded px-2 py-1 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search in PDF..."
          />
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            onClick={exportJSON}
          >
            Export JSON
          </button>
          <button
            className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>

        {/* Page navigation */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Page</label>
          <div className="flex items-center gap-2">
            <button
              className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
              onClick={() => jumpToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ◀
            </button>
            <span className="text-sm">
              {currentPage} / {totalPages}
            </span>
            <button
              className="px-2 py-1 border rounded text-sm hover:bg-gray-100"
              onClick={() => jumpToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Field templates for current page */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold">Fields for page {currentPage}</label>
            <button
              className="px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              onClick={() => setAddFieldModal(true)}
              title="Add custom field"
            >
              + field
            </button>
          </div>
          {currentPageTemplate.map((field) => {
            const key = `${currentPage}:${field.id}`;
            return (
              <div key={field.id} className="space-y-1">
                <label className="text-xs font-medium">{field.label}</label>
                <input
                  className="w-full border rounded px-2 py-1 text-sm"
                  value={pageForm[key] || ""}
                  onChange={(e) => handleTemplateInput(field.id, e.target.value, currentPage)}
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
        </div>

        {/* Highlights list */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">Your Highlights</label>
          {highlights.filter((h) => h.kind === "user").length === 0 ? (
            <p className="text-xs text-gray-500">
              No highlights yet. Select text in the PDF to create highlights.
            </p>
          ) : (
            <div className="space-y-1">
              {highlights
                .filter((h) => h.kind === "user")
                .map((h) => (
                  <div
                    key={h.id}
                    className="flex items-start gap-1 p-2 bg-blue-50 rounded text-xs"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{h.label}</div>
                      <div className="text-gray-500">Page {h.pageNumber}</div>
                    </div>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => setRelabelModal({ isOpen: true, highlightId: h.id })}
                      title="Relabel"
                    >
                      ✎
                    </button>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => deleteHighlight(h.id)}
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </aside>

      {/* Main PDF viewer */}
      <main className="flex-1 overflow-hidden">
        <Root fileUrl={source}>
          <PDFViewerContent
            highlights={highlights}
            onAddHighlight={addHighlight}
            searchTerm={searchTerm}
            onSearchResultsChange={setSearchResultCount}
            onUpdateSearchHighlights={handleSearchHighlights}
            onSearchError={(error) => toast.error(error)}
          />
        </Root>
      </main>
    </div>
  );
}
