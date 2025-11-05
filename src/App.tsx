import {
  // NEW: Utilities
  CanvasLayer,
  CurrentZoom,
  CustomLayer,
  HighlightLayer,
  Page,
  Pages,
  Root,
  Search,
  // NEW: Selection tooltip
  SelectionTooltip,
  TextLayer,
  // NEW: AnnotationLayer for PDF forms and links
  AnnotationLayer,
  Thumbnail,
  // NEW: Thumbnail navigation
  Thumbnails,
  usePdf,
  usePdfJump,
  usePDFPageNumber,
  useSearch,
  useSelectionDimensions,
  // NEW: Zoom controls
  ZoomIn,
  ZoomOut,
} from "@anaralabs/lector";
import { GlobalWorkerOptions } from "pdfjs-dist";
import "pdfjs-dist/web/pdf_viewer.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { PDFList, PDFUpload, PageNavigationButtons, SearchUI } from "./components";
import { ConfirmModal, InputModal } from "./components/Modal";
import { SchemaForm } from "./components/SchemaForm";
import { TemplateManager } from "./components/TemplateManager";
import { Toast, useToast } from "./components/Toast";
import { usePDFManager } from "./hooks/usePDFManager";
import type { SearchMatch } from "./types";
import { createSourcedValue, parseSchema } from "./utils/schemaParser";

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
/** Document-level fields (available on all pages) */
const defaultTemplates: FieldTemplate[] = [
  // Study Identification
  {
    id: "study_id",
    label: "Study ID (DOI/PMID)",
    placeholder: "e.g., 10.1161/STROKEAHA.116.014078",
  },
  { id: "first_author", label: "First Author", placeholder: "e.g., Kim" },
  { id: "year", label: "Year of Publication", placeholder: "e.g., 2016" },
  { id: "country", label: "Country", placeholder: "e.g., Korea" },
  // Study Design
  {
    id: "research_question",
    label: "Research Question",
    placeholder: "Primary research question",
  },
  {
    id: "study_design",
    label: "Study Design",
    placeholder: "e.g., Retrospective-Matched Case-Control",
  },
  {
    id: "control_definition",
    label: "Control Group Definition",
    placeholder: "How was control defined?",
  },
  // Sample Size
  {
    id: "total_patients",
    label: "Total Patients (N)",
    placeholder: "e.g., 112",
  },
  {
    id: "intervention_size",
    label: "Intervention Group Size",
    placeholder: "e.g., 28",
  },
  {
    id: "control_size",
    label: "Control Group Size",
    placeholder: "e.g., 56",
  },
  // Demographics
  {
    id: "age_mean",
    label: "Age (Mean ± SD)",
    placeholder: "e.g., 59.0 ± 11.6",
  },
  {
    id: "gender_male_pct",
    label: "Gender (% Male)",
    placeholder: "e.g., 64.3%",
  },
  {
    id: "baseline_status",
    label: "Baseline Neurological Status",
    placeholder: "e.g., GCS score, NIHSS",
  },
  // Outcomes
  {
    id: "primary_outcome",
    label: "Primary Outcome",
    placeholder: "e.g., mRS 0-2 at 12 months",
  },
  {
    id: "effect_measure",
    label: "Effect Measure (OR/RR/HR)",
    placeholder: "e.g., OR 4.815",
  },
  {
    id: "confidence_interval",
    label: "95% CI",
    placeholder: "e.g., [1.45, 3.78]",
  },
  { id: "p_value", label: "P-value", placeholder: "e.g., 0.009" },
];

const arrayPathRegex = /^(.+)\[(\d+)\]$/;

const getValueAtPath = (obj: any, path: string): any => {
  if (!obj) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, path)) {
    return obj[path];
  }

  const parts = path.split(".");
  let current: any = obj;

  for (const part of parts) {
    if (current === undefined || current === null) {
      return undefined;
    }

    const arrayMatch = part.match(arrayPathRegex);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key]?.[parseInt(index, 10)];
    } else {
      current = current?.[part];
    }
  }

  return current;
};

const cloneContainer = (value: any) => {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (value && typeof value === "object") {
    return { ...value };
  }
  return {};
};

const setValueAtPath = (
  source: Record<string, any> | undefined,
  path: string,
  value: any
): Record<string, any> => {
  const result: Record<string, any> = { ...(source || {}) };
  const parts = path.split(".");
  let current: any = result;

  parts.forEach((part, index) => {
    const isLast = index === parts.length - 1;
    const arrayMatch = part.match(arrayPathRegex);

    if (arrayMatch) {
      const [, key, idxStr] = arrayMatch;
      const idx = parseInt(idxStr, 10);
      const existingArray = Array.isArray(current[key])
        ? [...current[key]]
        : [];
      current[key] = existingArray;

      if (isLast) {
        existingArray[idx] = value;
        return;
      }

      const nextValue = cloneContainer(existingArray[idx]);
      existingArray[idx] = nextValue;
      current = nextValue;
      return;
    }

    if (isLast) {
      current[part] = value;
      return;
    }

    const nextValue = cloneContainer(current[part]);
    current[part] = nextValue;
    current = nextValue;
  });

  return result;
};

/** ---------- PDF Viewer Component (inside Root context) ---------- */
function PDFViewerContent({
  highlights,
  onAddHighlight,
  onSearchResultsChange,
  onPageChange,
  onJumpToPageReady,
  onSearchResultsData,
  onRequestHighlightLabel,
}: {
  highlights: LabeledHighlight[];
  onAddHighlight: (rect: Rect, pageNumber: number, label: string) => void;
  onSearchResultsChange: (count: number) => void;
  onPageChange: (page: number, total: number) => void;
  onJumpToPageReady: (
    jumpFn: (page: number, options?: { behavior: "auto" }) => void
  ) => void;
  onSearchResultsData: (results: SearchMatch[]) => void;
  onRequestHighlightLabel: (
    rect: Rect,
    pageNumber: number,
    defaultLabel: string,
    onConfirm: (label: string) => void
  ) => void;
}) {
  // Use Lector hooks
  const selectionDimensions = useSelectionDimensions();
  const { jumpToPage } = usePdfJump();
  const currentPageNumber = usePDFPageNumber();
  const pdfDocumentProxy = usePdf((state) => state.pdfDocumentProxy);
  const totalPages = pdfDocumentProxy?.numPages || 0;
  const { searchResults } = useSearch();

  // Expose jumpToPage function to parent whenever it changes
  useEffect(() => {
    if (jumpToPage) {
      onJumpToPageReady(jumpToPage);
    }
    // Intentionally excluding onJumpToPageReady from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToPage]);

  // Notify parent of page changes
  useEffect(() => {
    if (currentPageNumber && totalPages) {
      onPageChange(currentPageNumber, totalPages);
    }
    // Intentionally excluding onPageChange from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageNumber, totalPages]);

  // State for pending selection
  const [pendingSelection, setPendingSelection] = useState<{
    rects: Rect[];
    pageNumber: number;
    text: string;
  } | null>(null);

  // SearchUI component manages its own search state independently
  // No need to manage search in PDFViewerContent

  // Process search results and update count (HighlightLayer handles visual highlighting)
  useEffect(() => {
    const hasExactMatches = searchResults?.exactMatches && searchResults.exactMatches.length > 0;
    const hasFuzzyMatches = searchResults?.fuzzyMatches && searchResults.fuzzyMatches.length > 0;
    
    if (hasExactMatches || hasFuzzyMatches) {
      // Combine exact and fuzzy matches for total count
      const exactCount = searchResults.exactMatches?.length || 0;
      const fuzzyCount = searchResults.fuzzyMatches?.length || 0;
      const totalCount = exactCount + fuzzyCount;
      
      onSearchResultsChange(totalCount);
      
      // Combine all matches for results data
      const allMatches = [
        ...(searchResults.exactMatches || []).map((match, idx) => ({
          id: `exact-${idx}-${Date.now()}`,
          pageNumber: match.pageNumber,
          text: match.text || "",
          matchIndex: match.matchIndex,
          type: 'exact' as const,
        })),
        ...(searchResults.fuzzyMatches || []).map((match, idx) => ({
          id: `fuzzy-${idx}-${Date.now()}`,
          pageNumber: match.pageNumber,
          text: match.text || "",
          matchIndex: match.matchIndex,
          type: 'fuzzy' as const,
        })),
      ];
      
      onSearchResultsData(allMatches as SearchMatch[]);
    } else {
      onSearchResultsChange(0);
      onSearchResultsData([]);
    }
    // Intentionally excluding callbacks from deps to prevent infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchResults]);

  // OLD CODE REMOVED - HighlightLayer now handles visual highlighting automatically
  // The old async highlight creation code has been removed
  // Search highlighting now works via jumpToHighlightRects() when clicking results

  /*
  // REMOVED: Old highlight creation code (lines 354-601)
  // This entire async function has been removed because HighlightLayer
  // now handles search highlighting automatically via jumpToHighlightRects()
  */


  // Handle text selection - store pending selection
  useEffect(() => {
    const dimension = selectionDimensions.getDimension();
    if (dimension && dimension.highlights && dimension.highlights.length > 0) {
      // Convert HighlightRect[] to Rect[]
      const rects: Rect[] = dimension.highlights.map(
        (hRect: {
          left: number;
          top: number;
          width: number;
          height: number;
        }) => ({
          x: hRect.left,
          y: hRect.top,
          width: hRect.width,
          height: hRect.height,
        })
      );
      setPendingSelection({
        rects,
        pageNumber: currentPageNumber || 1,
        text: dimension.text || "",
      });
    }
  }, [selectionDimensions, currentPageNumber]);

  // Handle highlight creation from pending selection
  const createHighlightFromSelection = useCallback(() => {
    if (pendingSelection) {
      const rect = pendingSelection.rects[0];
      const defaultLabel = pendingSelection.text.substring(0, 50);
      onRequestHighlightLabel(
        rect,
        pendingSelection.pageNumber,
        defaultLabel,
        (label) => {
          onAddHighlight(rect, pendingSelection.pageNumber, label);
          setPendingSelection(null);
        }
      );
    }
  }, [pendingSelection, onAddHighlight, onRequestHighlightLabel]);

  return (
    <div className="relative w-full max-w-full h-full overflow-hidden flex items-center justify-center">
      <Pages className="p-4 w-full max-w-full dark:invert-[94%] dark:hue-rotate-180 dark:brightness-[80%] dark:contrast-[228%]" style={{ transform: 'scale(0.85)', transformOrigin: 'center center' }}>
        <Page>
          <CanvasLayer />
          <TextLayer />
          {/* Selection Tooltip with Highlight Button */}
          {selectionDimensions && (
            <SelectionTooltip>
              <button
                onClick={createHighlightFromSelection}
                className="bg-white shadow-lg rounded-md px-3 py-1 hover:bg-yellow-200/70"
              >
                Highlight
              </button>
            </SelectionTooltip>
          )}
          <AnnotationLayer />
          <HighlightLayer className="bg-yellow-300/40" />
          <CustomLayer>
            {(pageNumber) => {
              const pageHighlights = highlights.filter(
                (h) => h.pageNumber === pageNumber
              );
              
              return (
                <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 100 }}>
                  {pageHighlights.map((h) => (
                    <div
                      key={h.id}
                      className="absolute pointer-events-none"
                      style={{
                        left: `${h.x}px`,
                        top: `${h.y}px`,
                        width: `${h.width}px`,
                        height: `${h.height}px`,
                        backgroundColor:
                          h.kind === "search"
                            ? "rgba(255, 255, 0, 0.4)"
                            : "rgba(0, 255, 0, 0.3)",
                      }}
                    />
                  ))}
                </div>
              );
            }}
          </CustomLayer>
        </Page>
      </Pages>
      
      {/* Page Navigation Buttons - Inside Root for context access */}
      <PageNavigationButtons onPageChange={onPageChange} />
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
    setCurrentPdfId,
    uploadPDF,
    removePDF,
    getCurrentPDFUrl,
    loading: pdfLoading,
  } = usePDFManager(currentProject);

  // Load blob URL when PDF changes
  useEffect(() => {
    if (currentPdfId) {
      getCurrentPDFUrl()
        .then((url) => {
          if (url) {
            // Revoke old URL if exists
            if (pdfBlobUrlRef.current) {
              URL.revokeObjectURL(pdfBlobUrlRef.current);
            }
            setPdfBlobUrl(url);
            pdfBlobUrlRef.current = url;
          } else {
            error("Failed to create PDF blob URL");
          }
        })
        .catch((err) => {
          console.error("Error loading PDF blob URL:", err);
          error(
            `Failed to load PDF: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
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
  }, [currentPdfId, getCurrentPDFUrl, error]);

  // Determine PDF source (blob URL or static URL)
  const pdfSource = pdfBlobUrl || source;

  /** Search */
  const [, setSearchResultsData] = useState<SearchMatch[]>([]);

  /** Highlights */
  const [highlights, setHighlights] = useState<LabeledHighlight[]>(() => {
    const saved = localStorage.getItem(`proj:${currentProject}:highlights`);
    return saved ? JSON.parse(saved) : [];
  });

  /** Field Templates */
  const [templates, setTemplates] = useState<FieldTemplate[]>(
    () => {
      const saved = localStorage.getItem(`proj:${currentProject}:templates`);
      if (!saved) return defaultTemplates;
      
      const parsed = JSON.parse(saved);
      // Migration: convert old page-based format to document-level array
      if (!Array.isArray(parsed)) {
        // Silent migration to new format
        return defaultTemplates;
      }
      return parsed;
    }
  );

  /** Page Form Data */
  const [pageForm, setPageForm] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem(`proj:${currentProject}:pageForm`);
    return saved ? JSON.parse(saved) : {};
  });
  const [pendingHighlightLinkPath, setPendingHighlightLinkPath] = useState<
    string | null
  >(null);

  /** Page Navigation - synced with PDFViewerContent */
  const [, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(9);
  const jumpToPageFn = useRef<
    ((page: number, options?: { behavior: "auto" }) => void) | null
  >(null);

  /** Input Modal State */
  const [inputModalState, setInputModalState] = useState<{
    isOpen: boolean;
    type: "highlight" | "project" | "relabel" | null;
    title: string;
    message: string;
    defaultValue: string;
    onConfirm: (value: string) => void;
  }>({
    isOpen: false,
    type: null,
    title: "",
    message: "",
    defaultValue: "",
    onConfirm: () => {},
  });

  /** Confirm Modal State */
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: "info" | "warning" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: "info",
  });

  // Sync is handled via state changes only
  // No separate page input tracking needed

  /** Handle jumpToPage ready from PDFViewerContent */
  const handleJumpToPageReady = useCallback(
    (jumpFn: (page: number, options?: { behavior: "auto" }) => void) => {
      jumpToPageFn.current = jumpFn;
    },
    []
  );

  // Schema parsing
  const [parsedSchema, setParsedSchema] = useState<ReturnType<
    typeof parseSchema
  > | null>(null);
  const [useSchemaForm, setUseSchemaForm] = useState(false);

  useEffect(() => {
    if (!useSchemaForm) {
      setPendingHighlightLinkPath(null);
    }
  }, [useSchemaForm]);

  useEffect(() => {
    if (
      pendingHighlightLinkPath &&
      !highlights.some((h) => h.kind === "user")
    ) {
      setPendingHighlightLinkPath(null);
    }
  }, [highlights, pendingHighlightLinkPath]);

  // Template Manager modal
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // UI state for new Lector features
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [showSchemaForm, setShowSchemaForm] = useState(true);
  const [showSearchUI, setShowSearchUI] = useState(true);

  // Parse schema on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        // Load schema dynamically to avoid build-time issues
        const response = await fetch("/schema.json");
        if (response.ok) {
          const schema = await response.json();
          const parsed = parseSchema(schema);
          setParsedSchema(parsed);
        } else {
          console.warn("Schema.json not found, schema forms will be disabled");
        }
      } catch (err) {
        console.error("Schema parse error:", err);
        error("Failed to load schema");
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
    localStorage.setItem(
      `proj:${currentProject}:highlights`,
      JSON.stringify(highlights)
    );
  }, [currentProject, highlights]);

  useEffect(() => {
    localStorage.setItem(
      `proj:${currentProject}:templates`,
      JSON.stringify(templates)
    );
  }, [currentProject, templates]);

  useEffect(() => {
    localStorage.setItem(
      `proj:${currentProject}:pageForm`,
      JSON.stringify(pageForm)
    );
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
    setTemplates(
      savedTemplates ? JSON.parse(savedTemplates) : defaultTemplates
    );
    const savedForm = localStorage.getItem(`proj:${proj}:pageForm`);
    setPageForm(savedForm ? JSON.parse(savedForm) : {});
    setPendingHighlightLinkPath(null);
    success(`Switched to project: ${proj}`);
  };

  /** Add/Delete projects */
  const addProject = () => {
    setInputModalState({
      isOpen: true,
      type: "project",
      title: "Create New Project",
      message: "Enter a name for the new project:",
      defaultValue: "",
      onConfirm: (name) => {
        if (!projects.includes(name)) {
          setProjects([...projects, name]);
          switchProject(name);
          success(`Project "${name}" created`);
        } else {
          error("Project name already exists");
        }
        setInputModalState((prev) => ({ ...prev, isOpen: false }));
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
      title: "Delete Project",
      message: `Are you sure you want to delete project "${currentProject}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: () => {
        const newProjects = projects.filter((p) => p !== currentProject);
        setProjects(newProjects);
        localStorage.removeItem(`proj:${currentProject}:highlights`);
        localStorage.removeItem(`proj:${currentProject}:templates`);
        localStorage.removeItem(`proj:${currentProject}:pageForm`);
        switchProject("default");
        success(`Project "${currentProject}" deleted`);
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
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
      type: "relabel",
      title: "Edit Highlight Label",
      message: "Enter a new label for this highlight:",
      defaultValue: h.label,
      onConfirm: (newLabel) => {
        setHighlights((prev) =>
          prev.map((x) => (x.id === id ? { ...x, label: newLabel } : x))
        );
        success("Highlight updated");
        setInputModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  /** Delete highlight */
  const deleteHighlight = (id: string) => {
    setHighlights((prev) => prev.filter((x) => x.id !== id));
    success("Highlight deleted");
  };

  /** Link highlight to schema field */
  const linkHighlightToField = useCallback(
    (path: string, highlightId: string) => {
      const highlight = highlights.find((h) => h.id === highlightId);

      if (!highlight) {
        error("Highlight not found");
        setPendingHighlightLinkPath(null);
        return;
      }

      if (highlight.kind !== "user") {
        error("Only user highlights can be linked");
        setPendingHighlightLinkPath(null);
        return;
      }

      setPageForm((prev) => {
        const existing = getValueAtPath(prev, path);
        const existingValue =
          existing && typeof existing === "object" && "value" in existing
            ? (existing as { value: unknown }).value
            : existing;

        const normalizedValue =
          existingValue === undefined ||
          existingValue === null ||
          (typeof existingValue === "string" &&
            existingValue.trim().length === 0)
            ? highlight.label
            : existingValue;

        const nextValue = createSourcedValue(
          normalizedValue,
          highlight.label,
          `Page ${highlight.pageNumber}`,
          highlight.id
        );

        return setValueAtPath(prev, path, nextValue);
      });

      success("Highlight linked to field");
      setPendingHighlightLinkPath(null);
    },
    [highlights, error, success]
  );

  /** Request highlight label - opens modal */
  const handleRequestHighlightLabel = useCallback(
    (
      _rect: Rect,
      _pageNumber: number,
      defaultLabel: string,
      onConfirm: (label: string) => void
    ) => {
      setInputModalState({
        isOpen: true,
        type: "highlight",
        title: "Create Highlight",
        message: "Enter a label for this highlight:",
        defaultValue: defaultLabel,
        onConfirm: (label) => {
          onConfirm(label);
          setInputModalState((prev) => ({ ...prev, isOpen: false }));
        },
      });
    },
    []
  );

  /** Jump to page */
  const jumpToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) {
        return;
      }

      if (jumpToPageFn.current) {
        try {
          jumpToPageFn.current(page, { behavior: "auto" });
        } catch (err) {
          console.error("Error navigating to page:", err);
        }
      }
    },
    [totalPages]
  );

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

  const handlePDFDeleteConfirm = (
    _id: string,
    name: string,
    onConfirm: () => void
  ) => {
    setConfirmModalState({
      isOpen: true,
      title: "Delete PDF",
      message: `Delete "${name}"? This action cannot be undone.`,
      type: "danger",
      onConfirm: () => {
        onConfirm();
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  /** Template input */
  // Document-level templates (same fields available on all pages)
  const currentPageTemplate = templates;
  const handleTemplateInput = (
    fieldId: string,
    value: string
  ) => {
    // Document-level: use field ID directly without page prefix
    setPageForm((prev) => ({ ...prev, [fieldId]: value }));
  };

  /** Schema form handler */
  const handleSchemaDataChange = (
    path: string,
    value: string | number | boolean | Record<string, unknown>
  ) => {
    setPageForm((prev) => setValueAtPath(prev, path, value));
  };

  /** Template Manager handlers */
  const handleSaveTemplates = (
    newTemplates: FieldTemplate[]
  ) => {
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
      [
        "Project",
        "Page",
        "Field",
        "Value",
        "Highlight Label",
        "Highlight Page",
      ],
    ];
    Object.entries(pageForm).forEach(([key, value]) => {
      // Extract actual value if it's a SourcedValue object
      const actualValue =
        value && typeof value === "object" && "value" in value
          ? (value as { value: unknown }).value
          : value;

      let page: string;
      let field: string;

      // Template form fields use "page:field" format
      // Schema form fields use dot-notation paths like "I_StudyMetadata.studyID"
      if (key.includes(":")) {
        const parts = key.split(":");
        page = parts[0] || "";
        field = parts.slice(1).join(":"); // Handle cases where field contains ":"
      } else {
        // Schema form field - use dot notation path as field name
        page = ""; // Schema fields don't have page numbers
        field = key;
      }

      rows.push([
        currentProject,
        page || "",
        field || "",
        String(actualValue || ""),
        "",
        "",
      ]);
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

  // REMOVED: handleSearchHighlights callback - no longer needed with HighlightLayer

  /** Handle search results data */
  const handleSearchResultsData = useCallback((results: SearchMatch[]) => {
    setSearchResultsData(results);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Toast notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Input Modal */}
      <InputModal
        isOpen={inputModalState.isOpen}
        onClose={() =>
          setInputModalState((prev) => ({ ...prev, isOpen: false }))
        }
        title={inputModalState.title}
        message={inputModalState.message}
        defaultValue={inputModalState.defaultValue}
        onConfirm={inputModalState.onConfirm}
        placeholder="Enter value..."
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        onClose={() =>
          setConfirmModalState((prev) => ({ ...prev, isOpen: false }))
        }
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
              aria-label="Select project"
            >
              {projects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <button
              className="px-2 border rounded"
              onClick={addProject}
              aria-label="Add project"
            >
              +
            </button>
            <button
              className="px-2 border rounded"
              onClick={deleteProject}
              aria-label="Delete project"
            >
              🗑
            </button>
          </div>
        </div>

        {/* PDF Management */}
        <div className="space-y-2">
          <label className="text-xs font-semibold">PDF Management</label>
          <PDFUpload
            onFileSelect={handlePDFUpload}
            onError={error}
            loading={pdfLoading}
            error={null}
          />
          {pdfs.length > 0 && (
            <PDFList
              pdfs={pdfs}
              currentPdfId={currentPdfId}
              onSelect={handlePDFSelect}
              onDelete={handlePDFDelete}
              onDeleteConfirm={handlePDFDeleteConfirm}
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
            aria-label="PDF source URL"
            aria-describedby="pdf-url-description"
          />
          <span id="pdf-url-description" className="sr-only">
            Enter a URL to load a PDF file. Disabled when a PDF is uploaded.
          </span>
        </div>

        {/* Export */}
        <div className="space-x-2">
          <button
            onClick={exportJSON}
            className="text-sm bg-green-200 px-2 py-1 rounded hover:bg-green-300"
            aria-label="Export JSON"
          >
            Export JSON
          </button>
          <button
            onClick={exportCSV}
            className="text-sm bg-red-200 px-2 py-1 rounded hover:bg-red-300"
            aria-label="Export CSV"
          >
            Export CSV
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 grid ${showSchemaForm ? 'grid-cols-[1fr_340px]' : 'grid-cols-1'} overflow-hidden`}>
        {/* PDF Viewer with Thumbnails and Zoom Controls */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* PDF Viewer Grid with Optional Thumbnails - SINGLE Root wrapping everything */}
          <Root
            source={pdfSource}
            className="flex-1 flex flex-col"
            zoomOptions={{ minZoom: 0.5, maxZoom: 3 }}
            loader={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading PDF...</p>
                </div>
              </div>
            }
            onError={(err: Error | unknown) => {
              console.error("PDF loading error:", err);
              const errorMessage =
                err instanceof Error ? err.message : "Unknown error";
              error(`Failed to load PDF: ${errorMessage}`);
            }}
            onLoad={() => {
              info("PDF loaded successfully");
            }}
          >
            {/* Zoom Controls Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchUI(!showSearchUI)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
                  title="Toggle search"
                  aria-label={
                    showSearchUI ? "Hide search" : "Show search"
                  }
                  aria-expanded={showSearchUI ? "true" : "false"}
                >
                  {showSearchUI ? "◀ Hide" : "▶ Show"} Search
                </button>
                
                {/* Compact search input when sidebar is hidden */}
                {!showSearchUI && (
                  <Search>
                    <input
                      type="text"
                      placeholder="Search in document..."
                      className="w-64 px-3 py-1 text-sm border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </Search>
                )}
                <button
                  type="button"
                  onClick={() => setShowThumbnails(!showThumbnails)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
                  title="Toggle thumbnails"
                  aria-label={
                    showThumbnails ? "Hide thumbnails" : "Show thumbnails"
                  }
                  aria-expanded={showThumbnails ? "true" : "false"}
                >
                  {showThumbnails ? "◀ Hide" : "▶ Show"} Thumbnails
                </button>
                <button
                  type="button"
                  onClick={() => setShowSchemaForm(!showSchemaForm)}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-200"
                  title="Toggle schema form"
                  aria-label={
                    showSchemaForm ? "Hide schema form" : "Show schema form"
                  }
                  aria-expanded={showSchemaForm ? "true" : "false"}
                >
                  {showSchemaForm ? "◀ Hide" : "▶ Show"} Form
                </button>
              </div>

              <div className="flex items-center gap-2">
                <ZoomOut className="cursor-pointer hover:bg-gray-200 p-1 rounded" />
                <CurrentZoom className="text-sm font-mono" />
                <ZoomIn className="cursor-pointer hover:bg-gray-200 p-1 rounded" />
              </div>
            </div>

            {/* PDF Content Grid - Search and Pages as siblings */}
            <div className="flex-1 flex min-h-0 relative">
              {/* Search Sidebar */}
              {showSearchUI && (
                <Search>
                  <div className="w-80 border-r bg-white overflow-y-auto flex-shrink-0">
                    <SearchUI />
                  </div>
                </Search>
              )}

              {/* Thumbnails Sidebar */}
              {showThumbnails && (
                <div className="overflow-y-auto overflow-x-hidden h-full w-96 border-r">
                  <Thumbnails className="flex flex-col gap-4 items-center py-4">
                    <Thumbnail className="transition-all w-48 hover:shadow-lg hover:outline hover:outline-gray-300" />
                  </Thumbnails>
                </div>
              )}

              {/* Main PDF Viewer - Pages component */}
              <div className="flex-1 overflow-y-auto">
                <PDFViewerContent
                  highlights={highlights}
                  onAddHighlight={addHighlight}
                  onSearchResultsChange={() => {}}
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
        {showSchemaForm && (
        <aside className="border-l p-3 space-y-4 bg-white overflow-y-auto">
          {/* Form Type Toggle */}
          <div className="flex items-center gap-2">
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded ${
                !useSchemaForm ? "bg-blue-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setUseSchemaForm(false)}
              aria-label="Switch to Template Form"
              aria-pressed={!useSchemaForm ? "true" : "false"}
            >
              Template Form
            </button>
            <button
              className={`flex-1 px-3 py-2 text-xs border rounded ${
                useSchemaForm ? "bg-blue-500 text-white" : "bg-gray-100"
              }`}
              onClick={() => setUseSchemaForm(true)}
              aria-label="Switch to Schema Form"
              aria-pressed={useSchemaForm ? "true" : "false"}
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
                {useSchemaForm
                  ? "Schema Fields"
                  : "Document Fields"}
              </h3>
            </div>

            {useSchemaForm && parsedSchema ? (
              <SchemaForm
                sections={parsedSchema}
                data={pageForm}
                onDataChange={handleSchemaDataChange}
                onLinkHighlight={(path) => {
                  const userHighlights = highlights.filter(
                    (h) => h.kind === "user"
                  );

                  if (pendingHighlightLinkPath === path) {
                    setPendingHighlightLinkPath(null);
                    info("Highlight linking cancelled");
                    return;
                  }

                  if (userHighlights.length === 0) {
                    error("Create a highlight before linking");
                    return;
                  }

                  if (userHighlights.length === 1) {
                    info(`Link highlight to field: ${path}`);
                    linkHighlightToField(path, userHighlights[0].id);
                    return;
                  }

                  info(`Select a highlight to link to field: ${path}`);
                  setPendingHighlightLinkPath(path);
                }}
              />
            ) : (
              <>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {currentPageTemplate.map((f) => {
                    // Document-level: use field ID directly
                    const inputId = `field-${f.id}`;
                    return (
                      <div key={f.id} className="space-y-1">
                        <label htmlFor={inputId} className="text-xs">
                          {f.label}
                        </label>
                        <input
                          id={inputId}
                          className="w-full border p-1 rounded text-sm"
                          placeholder={f.placeholder || ""}
                          value={pageForm[f.id] || ""}
                          onChange={(e) =>
                            handleTemplateInput(
                              f.id,
                              e.target.value
                            )
                          }
                          aria-label={f.label}
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
              {pendingHighlightLinkPath && (
                <button
                  className="text-xs text-blue-600 hover:text-blue-700"
                  onClick={() => setPendingHighlightLinkPath(null)}
                >
                  Cancel
                </button>
              )}
            </div>
            {pendingHighlightLinkPath && (
              <div className="text-xs text-blue-600">
                Select a highlight below to link to {pendingHighlightLinkPath}
              </div>
            )}
            <ul className="text-sm divide-y max-h-56 overflow-auto">
              {highlights.length === 0 && (
                <li className="text-xs text-gray-500 py-2">
                  No highlights yet. Select text in the PDF to create
                  highlights.
                </li>
              )}
              {highlights.map((h) => (
                <li
                  key={h.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-xs flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded ${
                          h.kind === "search" ? "bg-yellow-400" : "bg-green-400"
                        }`}
                      ></span>
                      {h.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      p.{h.pageNumber}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {pendingHighlightLinkPath && h.kind === "user" && (
                      <button
                        className="px-2 text-xs border rounded border-blue-300 text-blue-600 hover:text-blue-700 hover:border-blue-400"
                        onClick={() =>
                          linkHighlightToField(pendingHighlightLinkPath!, h.id)
                        }
                        aria-label={`Link highlight: ${h.label}`}
                      >
                        Link
                      </button>
                    )}
                    <button
                      className="px-2 text-xs border rounded"
                      onClick={() => jumpToPage(h.pageNumber)}
                      aria-label={`Go to highlight on page ${h.pageNumber}`}
                    >
                      Go
                    </button>
                    {h.kind === "user" && (
                      <>
                        <button
                          className="px-2 text-xs border rounded"
                          onClick={() => relabelHighlight(h.id)}
                          aria-label={`Edit label for highlight: ${h.label}`}
                        >
                          ✏
                        </button>
                        <button
                          className="px-2 text-xs border rounded"
                          onClick={() => deleteHighlight(h.id)}
                          aria-label={`Delete highlight: ${h.label}`}
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
        )}
      </main>

      {/* Template Manager Modal */}
      <TemplateManager
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        templates={templates}
        onSaveTemplates={handleSaveTemplates}
      />
    </div>
  );
}
