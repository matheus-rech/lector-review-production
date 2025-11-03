import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { Toast, useToast } from "./components/Toast";
import { Modal } from "./components/Modal";
import { PDFUpload, PDFList } from "./components";
import { TemplateManager } from "./components/TemplateManager";
import { SchemaForm } from "./components/SchemaForm";
import { usePDFManager } from "./hooks/usePDFManager";
import { parseSchema } from "./utils/schemaParser";
import schemaJSON from "../schema.json";

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
  onPageChange,
  onJumpToPageReady,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number, label: string) => void;
  searchTerm: string;
  onSearchResultsChange: (count: number) => void;
  onUpdateSearchHighlights: (searchHighlights: LabeledHighlight[]) => void;
  onPageChange: (page: number, total: number) => void;
  onJumpToPageReady: (jumpFn: (page: number) => void) => void;
}) {
  // Use Lector hooks
  const selectionDimensions = useSelectionDimensions();
  const { currentPageNumber, totalPages, jumpToPage } = usePdfJump();
  const { searchResults, findExactMatches } = useSearch();
  
  // Expose jumpToPage function to parent
  useEffect(() => {
    if (jumpToPage) {
      onJumpToPageReady(jumpToPage);
    }
  }, [jumpToPage, onJumpToPageReady]);
  
  // Notify parent of page changes
  useEffect(() => {
    if (currentPageNumber && totalPages) {
      onPageChange(currentPageNumber, totalPages);
    }
  }, [currentPageNumber, totalPages, onPageChange]);
  
  // State for pending selection
  const [pendingSelection, setPendingSelection] = useState<any>(null);
  
  // Perform search when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      findExactMatches({ searchText: searchTerm });
    }
  }, [searchTerm, findExactMatches]);
  
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
          label: `Search: "${searchTerm}"`,
          kind: "search" as const,
          pageNumber: match.pageNumber || 1,
          x: rect.x || 0,
          y: rect.y || 0,
          width: rect.width || 200,
          height: rect.height || 20,
        };
      });
      
      // Add search highlights (replacing old search highlights)
      const userHighlights = highlights.filter(h => h.kind !== "search");
      const allHighlights = [...userHighlights, ...searchHighlights];
      
      // Update parent component's highlights via callback
      onUpdateSearchHighlights(searchHighlights);
    } else {
      onSearchResultsChange(0);
    }
  }, [searchResults, searchTerm, onSearchResultsChange]);
  
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
  // Toast notifications
  const { toasts, success, error, info, removeToast } = useToast();

  /** Projects */
  const [projects, setProjects] = useState<string[]>(() => {
    const saved = localStorage.getItem("projects");
    return saved ? JSON.parse(saved) : ["default"];
  });
  const [currentProject, setCurrentProject] = useState("default");

  /** PDF Source */
  const [source, setSource] = useState("/Kim2016.pdf");
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const pdfBlobUrlRef = useRef<string | null>(null);

  // PDF Manager
  const {
    pdfs,
    currentPdfId,
    currentPDF,
    setCurrentPdfId,
    uploadPDF,
    removePDF,
    getCurrentPDFUrl,
    loading: pdfLoading,
  } = usePDFManager(currentProject);

  // Load blob URL when PDF changes
  useEffect(() => {
    if (currentPdfId) {
      getCurrentPDFUrl().then((url) => {
        if (url) {
          // Revoke old URL if exists
          if (pdfBlobUrlRef.current) {
            URL.revokeObjectURL(pdfBlobUrlRef.current);
          }
          setPdfBlobUrl(url);
          pdfBlobUrlRef.current = url;
        }
      });
    } else {
      // Clear blob URL if no PDF selected
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
      setPdfBlobUrl(null);
    }
    
    return () => {
      if (pdfBlobUrlRef.current) {
        URL.revokeObjectURL(pdfBlobUrlRef.current);
        pdfBlobUrlRef.current = null;
      }
    };
  }, [currentPdfId, getCurrentPDFUrl]);

  // Determine PDF source (blob URL or static URL)
  const pdfSource = pdfBlobUrl || source;

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

  /** Page Navigation - synced with PDFViewerContent */
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(9);
  const [jumpToPageFn, setJumpToPageFn] = useState<((page: number) => void) | null>(null);

  /** Handle jumpToPage ready from PDFViewerContent */
  const handleJumpToPageReady = useCallback((jumpFn: (page: number) => void) => {
    setJumpToPageFn(() => jumpFn);
  }, []);

  // Schema parsing
  const [parsedSchema, setParsedSchema] = useState<ReturnType<typeof parseSchema> | null>(null);
  const [useSchemaForm, setUseSchemaForm] = useState(false);

  // Template Manager modal
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // Parse schema on mount
  useEffect(() => {
    try {
      const schema = parseSchema(schemaJSON);
      setParsedSchema(schema);
    } catch (err) {
      console.error("Schema parse error:", err);
      error("Failed to load schema");
    }
  }, []);

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

  /** Handle page change from PDFViewerContent */
  const handlePageChange = useCallback((page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  }, []);

  /** Switch project */
  const switchProject = (proj: string) => {
    setCurrentProject(proj);
    const savedHighlights = localStorage.getItem(`proj:${proj}:highlights`);
    setHighlights(savedHighlights ? JSON.parse(savedHighlights) : []);
    const savedTemplates = localStorage.getItem(`proj:${proj}:templates`);
    setTemplates(savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates);
    const savedForm = localStorage.getItem(`proj:${proj}:pageForm`);
    setPageForm(savedForm ? JSON.parse(savedForm) : {});
    success(`Switched to project: ${proj}`);
  };

  /** Add/Delete projects */
  const addProject = () => {
    const name = prompt("New project name?");
    if (name && !projects.includes(name)) {
      setProjects([...projects, name]);
      switchProject(name);
      success(`Project "${name}" created`);
    } else if (name && projects.includes(name)) {
      error("Project name already exists");
    }
  };

  const deleteProject = () => {
    if (currentProject === "default") {
      error("Cannot delete default project");
      return;
    }
    if (confirm(`Delete project "${currentProject}"?`)) {
      const newProjects = projects.filter((p) => p !== currentProject);
      setProjects(newProjects);
      localStorage.removeItem(`proj:${currentProject}:highlights`);
      localStorage.removeItem(`proj:${currentProject}:templates`);
      localStorage.removeItem(`proj:${currentProject}:pageForm`);
      switchProject("default");
      success(`Project "${currentProject}" deleted`);
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
    success("Highlight added");
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
      success("Highlight updated");
    }
  };

  /** Delete highlight */
  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
    success("Highlight deleted");
  };

  /** Jump to page */
  const jumpToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages) return;
    if (jumpToPageFn) {
      jumpToPageFn(page);
    } else {
      setCurrentPage(page);
    }
  }, [totalPages, jumpToPageFn]);

  /** PDF Upload handlers */
  const handlePDFUpload = async (file: File) => {
    try {
      const metadata = await uploadPDF(file);
      if (metadata) {
        success(`PDF "${file.name}" uploaded successfully`);
        setCurrentPdfId(metadata.id);
      } else {
        error("Failed to upload PDF");
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to upload PDF");
    }
  };

  const handlePDFSelect = (id: string) => {
    setCurrentPdfId(id);
    info("PDF selected");
  };

  const handlePDFDelete = async (id: string) => {
    try {
      const result = await removePDF(id);
      if (result) {
        success("PDF deleted");
      } else {
        error("Failed to delete PDF");
      }
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to delete PDF");
    }
  };

  /** Template input */
  const currentPageTemplate = templates[currentPage] || [];
  const handleTemplateInput = (fieldId: string, value: string, page: number) => {
    const key = `${page}:${fieldId}`;
    setPageForm((prev) => ({ ...prev, [key]: value }));
  };

  /** Schema form handler */
  const handleSchemaDataChange = (path: string, value: any) => {
    // For schema forms, we store data differently
    // Use path as key (e.g., "I_StudyMetadataAndIdentification.studyID")
    setPageForm((prev) => ({ ...prev, [path]: value }));
  };

  /** Template Manager handlers */
  const handleSaveTemplates = (newTemplates: Record<number, FieldTemplate[]>) => {
    setTemplates(newTemplates);
    success("Templates saved");
    setShowTemplateManager(false);
  };

  /** Export JSON */
  const exportJSON = () => {
    const data = {
      project: currentProject,
      source: pdfSource,
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
    URL.revokeObjectURL(url);
    success("Data exported as JSON");
  };

  /** Export CSV */
  const exportCSV = () => {
    const rows = [
      ["Project", "Page", "Field", "Value", "Highlight Label", "Highlight Page"],
    ];
    Object.entries(pageForm).forEach(([key, value]) => {
      const [page, field] = key.split(":");
      rows.push([currentProject, page || "", field || "", String(value || ""), "", ""]);
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
    URL.revokeObjectURL(url);
    success("Data exported as CSV");
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
    }
  }, [searchTerm]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

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
            <button className="px-2 border rounded" onClick={addProject} aria-label="Add project">
              +
            </button>
            <button className="px-2 border rounded" onClick={deleteProject} aria-label="Delete project">
              🗑
            </button>
          </div>
        </div>

        {/* PDF Management */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">PDF Management</label>
          <PDFUpload
            onFileSelect={handlePDFUpload}
            loading={pdfLoading}
            error={null}
          />
          {pdfs.length > 0 && (
            <PDFList
              pdfs={pdfs}
              currentPdfId={currentPdfId}
              onSelect={handlePDFSelect}
              onDelete={handlePDFDelete}
              loading={pdfLoading}
            />
          )}
        </div>

        {/* PDF Source Input (fallback) */}
        <div className="space-y-1">
          <label className="text-xs font-semibold">Or load from URL:</label>
          <input
            className="w-full border p-1 rounded text-sm"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            placeholder="Enter PDF URL..."
            disabled={!!currentPdfId}
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
          <button onClick={exportJSON} className="text-sm bg-green-200 px-2 py-1 rounded hover:bg-green-300" aria-label="Export JSON">
            Export JSON
          </button>
          <button onClick={exportCSV} className="text-sm bg-red-200 px-2 py-1 rounded hover:bg-red-300" aria-label="Export CSV">
            Export CSV
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 grid grid-cols-[1fr_340px]">
        {/* PDF Viewer */}
        <div className="overflow-hidden">
          <Root source={pdfSource} className="w-full h-screen">
            <PDFViewerContent
              highlights={highlights}
              onAddHighlight={addHighlight}
              searchTerm={searchTerm}
              onSearchResultsChange={setSearchResultCount}
              onUpdateSearchHighlights={handleSearchHighlights}
              onPageChange={handlePageChange}
              onJumpToPageReady={handleJumpToPageReady}
            />
          </Root>
        </div>

        {/* Right sidebar */}
        <aside className="border-l p-3 space-y-4 bg-white overflow-y-auto">
          {/* Page Navigation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold">Page</label>
            <div className="flex items-center gap-2">
              <button 
                className="px-2 border rounded hover:bg-gray-100" 
                onClick={() => jumpToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
              >
                ◀
              </button>
              <span className="text-sm">{currentPage} / {totalPages}</span>
              <button 
                className="px-2 border rounded hover:bg-gray-100" 
                onClick={() => jumpToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Form Type Toggle */}
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded ${
                !useSchemaForm ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
              onClick={() => setUseSchemaForm(false)}
            >
              Template Form
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded ${
                useSchemaForm ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
              onClick={() => setUseSchemaForm(true)}
            >
              Schema Form
            </button>
          </div>

          {/* Template Manager Button */}
          {!useSchemaForm && (
            <div className="mb-2">
              <button
                onClick={() => setShowTemplateManager(true)}
                aria-label="Manage field templates"
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center justify-center space-x-2"
              >
                <span>⚙️</span>
                <span>Manage Templates</span>
              </button>
            </div>
          )}

          {/* Per-Page Fields */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">
                {useSchemaForm ? 'Schema Fields' : `Fields for page ${currentPage}`}
              </h3>
            </div>

            {useSchemaForm && parsedSchema ? (
              <SchemaForm
                sections={parsedSchema}
                data={pageForm}
                onDataChange={handleSchemaDataChange}
                onLinkHighlight={(path) => {
                  info(`Link highlight to field: ${path}`);
                  // TODO: Implement highlight linking
                }}
              />
            ) : (
              <>
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
              </>
            )}
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

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        onSaveTemplates={handleSaveTemplates}
        totalPages={totalPages}
      />
    </div>
  );
}
