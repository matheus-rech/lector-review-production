import { useEffect, useState, useCallback, useRef } from "react";
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
  usePDFPageNumber,
  useSearch,
  usePdf,
  type ColoredHighlight,
  // NEW: Zoom controls
  ZoomIn,
  ZoomOut,
  CurrentZoom,
  // NEW: Thumbnail navigation
  Thumbnails,
  Thumbnail,
  // NEW: Selection tooltip
  SelectionTooltip,
  // NEW: Utilities
  calculateHighlightRects,
} from "@anaralabs/lector";
import { Toast, useToast } from "./components/Toast";
import { Modal, InputModal, ConfirmModal } from "./components/Modal";
import { PDFUpload, PDFList } from "./components";
import { TemplateManager } from "./components/TemplateManager";
import { SchemaForm } from "./components/SchemaForm";
import { usePDFManager } from "./hooks/usePDFManager";
import { parseSchema } from "./utils/schemaParser";

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
  onSearchResultsData,
  onRequestHighlightLabel,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number, label: string) => void;
  searchTerm: string;
  onSearchResultsChange: (count: number) => void;
  onUpdateSearchHighlights: (searchHighlights: LabeledHighlight[]) => void;
  onPageChange: (page: number, total: number) => void;
  onJumpToPageReady: (jumpFn: (page: number, options?: { behavior: "auto" }) => void) => void;
  onSearchResultsData: (results: any[]) => void;
  onRequestHighlightLabel: (rect: Rect, pageNumber: number, defaultLabel: string, onConfirm: (label: string) => void) => void;
}) {
  // Use Lector hooks
  const selectionDimensions = useSelectionDimensions();
  const { jumpToPage, jumpToHighlightRects } = usePdfJump();
  const currentPageNumber = usePDFPageNumber();
  const pdf = usePdf();
  // Access getPdfPageProxy safely through the pdf object
  const totalPages = pdf?.numPages || 0;
  const { searchResults, search } = useSearch();

  // Track if we've already set up jumpToPage
  const hasSetupJumpToPage = useRef(false);

  // Expose jumpToPage function to parent once on mount
  useEffect(() => {
    console.log('[PDFViewerContent] useEffect triggered - jumpToPage available:', !!jumpToPage, 'hasSetupJumpToPage:', hasSetupJumpToPage.current);
    if (jumpToPage && !hasSetupJumpToPage.current) {
      console.log('[PDFViewerContent] Calling onJumpToPageReady with jumpToPage function');
      onJumpToPageReady(jumpToPage);
      hasSetupJumpToPage.current = true;
      console.log('[PDFViewerContent] onJumpToPageReady called successfully, hasSetupJumpToPage set to true');
    } else if (!jumpToPage) {
      console.warn('[PDFViewerContent] jumpToPage is undefined/null, cannot call onJumpToPageReady');
    } else {
      console.log('[PDFViewerContent] jumpToPage already set up, skipping onJumpToPageReady call');
    }
  }, [jumpToPage, onJumpToPageReady]);

  // Debug: Log when jumpToPage is available
  useEffect(() => {
    console.log('[PDFViewerContent] State - jumpToPage:', !!jumpToPage, 'currentPage:', currentPageNumber, 'totalPages:', totalPages);
  }, [jumpToPage, currentPageNumber, totalPages]);

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
      search(searchTerm);
    }
  }, [searchTerm, search]);

  // Convert search results to highlights and update count using calculateHighlightRects
  useEffect(() => {
    if (searchResults?.exactMatches && searchResults.exactMatches.length > 0) {
      onSearchResultsChange(searchResults.exactMatches.length);
      onSearchResultsData(searchResults.exactMatches);

      // Use calculateHighlightRects for accurate positioning
      let cancelled = false;

      const createSearchHighlights = async () => {
        const searchHighlights: LabeledHighlight[] = [];

        for (const [index, match] of searchResults.exactMatches.entries()) {
          if (cancelled) break;

          try {
            // Get page proxy for accurate rect calculation
            const pageProxy = pdf ? await pdf.getPage(match.pageNumber) : null;

            if (pageProxy) {
              // Use calculateHighlightRects for accurate positioning
              const rects = await calculateHighlightRects(pageProxy, {
                pageNumber: match.pageNumber,
                text: match.text,
                matchIndex: match.matchIndex || 0,
              });

              // Convert accurate rects to our highlight format
              rects.forEach((rect) => {
                searchHighlights.push({
                  id: `search-${index}-${searchHighlights.length}-${Date.now()}`,
                  label: `Search: "${searchTerm}"`,
                  kind: "search" as const,
                  pageNumber: rect.pageNumber,
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height,
                });
              });
            } else {
              // Fallback to manual extraction if page proxy unavailable
              const rect = match.rects && match.rects[0] ? match.rects[0] :
                           match.rect ? match.rect :
                           { x: 100, y: 100, width: 200, height: 20 };

              searchHighlights.push({
                id: `search-${index}-${Date.now()}`,
                label: `Search: "${searchTerm}"`,
                kind: "search" as const,
                pageNumber: match.pageNumber || 1,
                x: rect.x || 0,
                y: rect.y || 0,
                width: rect.width || 200,
                height: rect.height || 20,
              });
            }
          } catch (error) {
            console.error('Failed to calculate highlight rects for match:', error);

            // Fallback to manual extraction on error
            const rect = match.rects && match.rects[0] ? match.rects[0] :
                         match.rect ? match.rect :
                         { x: 100, y: 100, width: 200, height: 20 };

            searchHighlights.push({
              id: `search-${index}-${Date.now()}`,
              label: `Search: "${searchTerm}"`,
              kind: "search" as const,
              pageNumber: match.pageNumber || 1,
              x: rect.x || 0,
              y: rect.y || 0,
              width: rect.width || 200,
              height: rect.height || 20,
            });
          }
        }

        if (!cancelled) {
          onUpdateSearchHighlights(searchHighlights);
        }
      };

      createSearchHighlights();

      // Cleanup function to prevent state updates after unmount
      return () => {
        cancelled = true;
      };
    } else {
      onSearchResultsChange(0);
      onSearchResultsData([]);
    }
  }, [searchResults, searchTerm, pdf, onSearchResultsChange, onSearchResultsData, onUpdateSearchHighlights]);

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
      const rect = pendingSelection.rects[0];
      const defaultLabel = pendingSelection.text.substring(0, 50);
      onRequestHighlightLabel(rect, pendingSelection.pageNumber, defaultLabel, (label) => {
        onAddHighlight(rect, pendingSelection.pageNumber, label);
        setPendingSelection(null);
      });
    }
  }, [pendingSelection, onAddHighlight, onRequestHighlightLabel]);

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
      {/* Selection Tooltip with Highlight Button */}
      <SelectionTooltip>
        {pendingSelection && (
          <div className="flex items-center gap-2">
            <button
              onClick={createHighlightFromSelection}
              className="px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors text-sm"
            >
              📝 Highlight Selected Text
            </button>
            <button
              onClick={() => setPendingSelection(null)}
              className="px-3 py-2 bg-gray-600 text-white rounded-lg shadow-lg hover:bg-gray-700 transition-colors text-sm"
            >
              ✕
            </button>
          </div>
        )}
      </SelectionTooltip>

      <Pages className="p-6">
        {totalPages > 0 ? (
          Array.from({ length: totalPages }, (_, index) => (
            <Page key={index + 1}>
              <CanvasLayer />
              <TextLayer />
              <ColoredHighlightLayer highlights={coloredHighlights} />
            </Page>
          ))
        ) : (
          // Render single page initially to allow PDF to load
          <Page>
            <CanvasLayer />
            <TextLayer />
            <ColoredHighlightLayer highlights={coloredHighlights} />
          </Page>
        )}
      </Pages>
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
  const [searchResultsData, setSearchResultsData] = useState<any[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

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
  const [pageInputValue, setPageInputValue] = useState("1");
  const jumpToPageFn = useRef<((page: number, options?: { behavior: "auto" }) => void) | null>(null);
  const [isJumpToPageReady, setIsJumpToPageReady] = useState(false);

  /** Input Modal State */
  const [inputModalState, setInputModalState] = useState<{
    isOpen: boolean;
    type: 'highlight' | 'project' | 'relabel' | null;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    defaultValue: '',
    onConfirm: () => {},
  });

  /** Confirm Modal State */
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'info' | 'warning' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'info',
  });

  // Sync page input with current page
  useEffect(() => {
    setPageInputValue(currentPage.toString());
  }, [currentPage]);

  /** Handle jumpToPage ready from PDFViewerContent */
  const handleJumpToPageReady = useCallback((jumpFn: (page: number, options?: { behavior: "auto" }) => void) => {
    console.log('[App.handleJumpToPageReady] Received jumpFn from PDFViewerContent');
    jumpToPageFn.current = jumpFn;
    setIsJumpToPageReady(true);
    console.log('[App.handleJumpToPageReady] jumpToPageFn.current is now set, isJumpToPageReady=true');
  }, []);

  // Schema parsing
  const [parsedSchema, setParsedSchema] = useState<ReturnType<typeof parseSchema> | null>(null);
  const [useSchemaForm, setUseSchemaForm] = useState(false);

  // Template Manager modal
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // UI state for new Lector features
  const [showThumbnails, setShowThumbnails] = useState(true);

  // Parse schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        // Load schema dynamically to avoid build-time issues
        const response = await fetch('/schema.json');
        if (response.ok) {
          const schema = await response.json();
          const parsed = parseSchema(schema);
          setParsedSchema(parsed);
        } else {
          console.warn('Schema.json not found, schema forms will be disabled');
        }
      } catch (err) {
        console.error('Schema parse error:', err);
        error('Failed to load schema');
      }
    };
    loadSchema();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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
    setInputModalState({
      isOpen: true,
      type: 'project',
      title: 'Create New Project',
      message: 'Enter a name for the new project:',
      defaultValue: '',
      onConfirm: (name) => {
        if (!projects.includes(name)) {
          setProjects([...projects, name]);
          switchProject(name);
          success(`Project "${name}" created`);
        } else {
          error("Project name already exists");
        }
        setInputModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const deleteProject = () => {
    if (currentProject === "default") {
      error("Cannot delete default project");
      return;
    }
    setConfirmModalState({
      isOpen: true,
      title: 'Delete Project',
      message: `Are you sure you want to delete project "${currentProject}"? This action cannot be undone.`,
      type: 'danger',
      onConfirm: () => {
        const newProjects = projects.filter((p) => p !== currentProject);
        setProjects(newProjects);
        localStorage.removeItem(`proj:${currentProject}:highlights`);
        localStorage.removeItem(`proj:${currentProject}:templates`);
        localStorage.removeItem(`proj:${currentProject}:pageForm`);
        switchProject("default");
        success(`Project "${currentProject}" deleted`);
        setConfirmModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
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
    setInputModalState({
      isOpen: true,
      type: 'relabel',
      title: 'Edit Highlight Label',
      message: 'Enter a new label for this highlight:',
      defaultValue: h.label,
      onConfirm: (newLabel) => {
        setHighlights((prev) =>
          prev.map((x) => (x.id === id ? { ...x, label: newLabel } : x))
        );
        success("Highlight updated");
        setInputModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  /** Delete highlight */
  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
    success("Highlight deleted");
  };

  /** Request highlight label - opens modal */
  const handleRequestHighlightLabel = useCallback((rect: Rect, pageNumber: number, defaultLabel: string, onConfirm: (label: string) => void) => {
    setInputModalState({
      isOpen: true,
      type: 'highlight',
      title: 'Create Highlight',
      message: 'Enter a label for this highlight:',
      defaultValue: defaultLabel,
      onConfirm: (label) => {
        onConfirm(label);
        setInputModalState(prev => ({ ...prev, isOpen: false }));
      },
    });
  }, []);

  /** Jump to page */
  const jumpToPage = useCallback((page: number) => {
    console.log('[App.jumpToPage] Called with page:', page, 'totalPages:', totalPages, 'isReady:', isJumpToPageReady);
    console.log('[App.jumpToPage] jumpToPageFn.current:', jumpToPageFn.current);

    if (page < 1 || page > totalPages) {
      console.log('[App.jumpToPage] Page out of bounds, returning');
      return;
    }

    if (jumpToPageFn.current) {
      console.log('[App.jumpToPage] Calling Lector jumpToPage with page:', page);
      try {
        jumpToPageFn.current(page, { behavior: "auto" });
        console.log('[App.jumpToPage] Lector jumpToPage called successfully');
      } catch (err) {
        console.error('[App.jumpToPage] Error calling Lector jumpToPage:', err);
      }
    } else {
      console.warn('[App.jumpToPage] jumpToPageFn.current is NULL - Lector hook not ready!');
      console.warn('[App.jumpToPage] This means navigation will NOT work');
    }
  }, [totalPages, isJumpToPageReady]);

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

  /** Handle search results data */
  const handleSearchResultsData = useCallback((results: any[]) => {
    setSearchResultsData(results);
    setCurrentSearchIndex(0); // Reset to first result
  }, []);

  /** Navigate to specific search result */
  const jumpToSearchResult = useCallback((index: number) => {
    if (searchResultsData[index] && jumpToPageFn.current) {
      const result = searchResultsData[index];
      jumpToPageFn.current(result.pageNumber);
      setCurrentSearchIndex(index);
    }
  }, [searchResultsData]);

  /** Navigate to next search result */
  const nextSearchResult = useCallback(() => {
    if (searchResultsData.length > 0) {
      const nextIndex = (currentSearchIndex + 1) % searchResultsData.length;
      jumpToSearchResult(nextIndex);
    }
  }, [currentSearchIndex, searchResultsData.length, jumpToSearchResult]);

  /** Navigate to previous search result */
  const prevSearchResult = useCallback(() => {
    if (searchResultsData.length > 0) {
      const prevIndex = (currentSearchIndex - 1 + searchResultsData.length) % searchResultsData.length;
      jumpToSearchResult(prevIndex);
    }
  }, [currentSearchIndex, searchResultsData.length, jumpToSearchResult]);

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

      {/* Input Modal */}
      <InputModal
        isOpen={inputModalState.isOpen}
        onClose={() => setInputModalState(prev => ({ ...prev, isOpen: false }))}
        title={inputModalState.title}
        message={inputModalState.message}
        defaultValue={inputModalState.defaultValue}
        onConfirm={inputModalState.onConfirm}
        placeholder="Enter value..."
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() => setConfirmModalState(prev => ({ ...prev, isOpen: false }))}
        title={confirmModalState.title}
        message={confirmModalState.message}
        onConfirm={confirmModalState.onConfirm}
        type={confirmModalState.type}
      />

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

        {/* Enhanced Search */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">Search</label>
          <input
            className="w-full border p-1 rounded text-sm"
            placeholder="Search in PDF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {searchResultCount > 0 && (
            <>
              {/* Navigation Controls */}
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs text-gray-600">
                  Match {currentSearchIndex + 1} of {searchResultCount}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={prevSearchResult}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                    title="Previous match"
                  >
                    ◀
                  </button>
                  <button
                    onClick={nextSearchResult}
                    className="px-2 py-1 text-xs border rounded hover:bg-gray-100"
                    title="Next match"
                  >
                    ▶
                  </button>
                </div>
              </div>

              {/* Results List */}
              <div className="max-h-40 overflow-y-auto border rounded text-xs bg-white">
                {searchResultsData.slice(0, 10).map((result: any, index: number) => (
                  <div
                    key={index}
                    onClick={() => jumpToSearchResult(index)}
                    className={`p-2 cursor-pointer hover:bg-blue-50 border-b last:border-b-0 ${
                      index === currentSearchIndex ? 'bg-blue-100' : ''
                    }`}
                  >
                    <div className="font-medium text-blue-700">Page {result.pageNumber}</div>
                    <div className="text-gray-600 truncate">
                      {result.text?.substring(0, 60) || 'Match found'}...
                    </div>
                  </div>
                ))}
                {searchResultsData.length > 10 && (
                  <div className="p-2 text-center text-gray-500 italic">
                    Showing first 10 of {searchResultCount} results
                  </div>
                )}
              </div>
            </>
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
        {/* PDF Viewer with Thumbnails and Zoom Controls */}
        <div className="overflow-hidden flex flex-col">
          {/* PDF Viewer Grid with Optional Thumbnails - SINGLE Root wrapping everything */}
          <Root source={pdfSource} className="flex-1 flex flex-col" zoomOptions={{ minZoom: 0.5, maxZoom: 3 }}>
            {/* Zoom Controls Bar - NOW INSIDE ROOT */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
                  title="Toggle thumbnails"
                >
                  {showThumbnails ? '◀ Hide' : '▶ Show'} Thumbnails
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ZoomOut className="cursor-pointer hover:bg-gray-200 p-1 rounded" />
                <CurrentZoom className="text-sm font-mono" />
                <ZoomIn className="cursor-pointer hover:bg-gray-200 p-1 rounded" />
              </div>
            </div>

            {/* PDF Content Grid */}
            <div className={`flex-1 grid ${showThumbnails ? 'grid-cols-[200px_1fr]' : 'grid-cols-[0_1fr]'} transition-all duration-300`}>
              {/* Thumbnails Sidebar */}
              {showThumbnails && (
                <div className="border-r bg-gray-50 overflow-y-auto">
                  <Thumbnails className="p-2 space-y-2">
                    <Thumbnail className="border rounded hover:border-blue-500 cursor-pointer" />
                  </Thumbnails>
                </div>
              )}

              {/* Main PDF Viewer */}
              <div className="overflow-hidden">
                <PDFViewerContent
                  highlights={highlights}
                  onAddHighlight={addHighlight}
                  searchTerm={searchTerm}
                  onSearchResultsChange={setSearchResultCount}
                  onUpdateSearchHighlights={handleSearchHighlights}
                  onPageChange={handlePageChange}
                  onJumpToPageReady={handleJumpToPageReady}
                  onSearchResultsData={handleSearchResultsData}
                  onRequestHighlightLabel={handleRequestHighlightLabel}
                />
              </div>
            </div>
          </Root>
        </div>

        {/* Right sidebar */}
        <aside className="border-l p-3 space-y-4 bg-white overflow-y-auto">
          {/* Enhanced Page Navigation */}
          <div className="space-y-2">
            <label className="text-xs font-semibold">Page Navigation</label>

            {/* Button navigation with direct input */}
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => jumpToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                title="Previous page"
              >
                ◀
              </button>

              {/* Direct page input */}
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const pageNum = parseInt(pageInputValue);
                      if (pageNum >= 1 && pageNum <= totalPages) {
                        jumpToPage(pageNum);
                      }
                    }
                  }}
                  className="w-12 px-2 py-1 border rounded text-center text-xs"
                  aria-label="Go to page"
                />
                <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
              </div>

              <button
                className="px-2 py-1 text-xs border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => jumpToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                aria-label="Next page"
                title="Next page"
              >
                ▶
              </button>
            </div>

            {/* Quick jump buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => jumpToPage(1)}
                disabled={currentPage === 1}
                className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jump to first page"
              >
                First
              </button>
              <button
                onClick={() => jumpToPage(totalPages)}
                disabled={currentPage === totalPages}
                className="flex-1 text-xs px-2 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Jump to last page"
              >
                Last
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
