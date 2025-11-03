import { useEffect, useState } from "react";
import { GlobalWorkerOptions } from "pdfjs-dist";
import {
  Root,
  Pages,
  Page,
  CanvasLayer,
  TextLayer,
  AnnotationLayer,
  ColoredHighlightLayer,
  useSearch,
  useSelectionDimensions,
  usePdfJump,
  type ColoredHighlight,
} from "@anaralabs/lector";
import "pdfjs-dist/web/pdf_viewer.css";

// Set up PDF.js worker
GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

// ===== TYPES =====

type LabeledHighlight = {
  id: string;
  label: string;
  kind: "user" | "search";
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

type PageTemplateField = {
  id: string;
  label: string;
};

type Templates = Record<number, PageTemplateField[]>;
type PageFormData = Record<string, string>;

// ===== STORAGE HELPERS =====

const key = (project: string, name: string) => `proj:${project}:${name}`;

function loadProjects(): string[] {
  const stored = localStorage.getItem("projects");
  return stored ? JSON.parse(stored) : ["default"];
}

function saveProjects(projects: string[]) {
  localStorage.setItem("projects");
}

function loadCurrentProject(): string {
  return localStorage.getItem("current-project") || "default";
}

function saveCurrentProject(project: string) {
  localStorage.setItem("current-project", project);
}

function loadHighlights(project: string): LabeledHighlight[] {
  const stored = localStorage.getItem(key(project, "highlights"));
  return stored ? JSON.parse(stored) : [];
}

function saveHighlights(project: string, highlights: LabeledHighlight[]) {
  localStorage.setItem(key(project, "highlights"), JSON.stringify(highlights));
}

function loadPageForm(project: string): PageFormData {
  const stored = localStorage.getItem(key(project, "pageForm"));
  return stored ? JSON.parse(stored) : {};
}

function savePageForm(project: string, data: PageFormData) {
  localStorage.setItem(key(project, "pageForm"), JSON.stringify(data));
}

function loadTemplates(project: string): Templates {
  const stored = localStorage.getItem(key(project, "templates"));
  if (stored) return JSON.parse(stored);
  
  // Default templates
  return {
    1: [
      { id: "study_id", label: "Study ID" },
      { id: "design", label: "Design" },
    ],
    2: [
      { id: "n_total", label: "Total N" },
      { id: "arms", label: "Arms (brief)" },
    ],
    3: [
      { id: "outcome", label: "Primary Outcome" },
      { id: "effect", label: "Effect" },
      { id: "ci", label: "95% CI" },
    ],
  };
}

function saveTemplates(project: string, templates: Templates) {
  localStorage.setItem(key(project, "templates"), JSON.stringify(templates));
}

// ===== PDF VIEWER CONTENT (Uses Lector Hooks) =====

function PDFViewerContent({
  currentProject,
  highlights,
  setHighlights,
  pageForm,
  setPageForm,
  templates,
  setTemplates,
  searchTerm,
}: {
  currentProject: string;
  highlights: LabeledHighlight[];
  setHighlights: (h: LabeledHighlight[]) => void;
  pageForm: PageFormData;
  setPageForm: (d: PageFormData) => void;
  templates: Templates;
  setTemplates: (t: Templates) => void;
  searchTerm: string;
}) {
  // Use Lector hooks
  const { jumpToPage, currentPageNumber, totalPages } = usePdfJump();
  const { searchResults, findExactMatches } = useSearch();
  const selectionDimensions = useSelectionDimensions();

  const currentPage = currentPageNumber || 1;

  // Perform search when searchTerm changes
  useEffect(() => {
    if (searchTerm && searchTerm.trim().length > 0) {
      findExactMatches({ searchText: searchTerm });
    }
  }, [searchTerm, findExactMatches]);

  // Convert search results to highlights
  const searchHighlights: ColoredHighlight[] = (searchResults?.exactMatches || []).map(
    (result, idx) => ({
      id: `search-${idx}`,
      pageNumber: result.pageNumber,
      rects: [
        {
          x: 0, // These would need to be calculated from text position
          y: 0,
          width: 100,
          height: 20,
        },
      ],
      color: "rgba(255, 255, 0, 0.3)", // Yellow for search results
    })
  );

  // Convert user highlights to ColoredHighlight format
  const userHighlights: ColoredHighlight[] = highlights.map((h) => ({
    id: h.id,
    pageNumber: h.pageNumber,
    rects: [
      {
        x: h.x,
        y: h.y,
        width: h.width,
        height: h.height,
      },
    ],
    color: h.color || "rgba(0, 255, 0, 0.3)", // Green for user highlights
  }));

  // Combine all highlights
  const allHighlights = [...searchHighlights, ...userHighlights];

  // Handle text selection
  useEffect(() => {
    if (selectionDimensions && selectionDimensions.rects.length > 0) {
      const rect = selectionDimensions.rects[0];
      const label = prompt("Enter a label for this highlight:");
      
      if (label) {
        const newHighlight: LabeledHighlight = {
          id: `user-${Date.now()}`,
          label,
          kind: "user",
          pageNumber: currentPage,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          color: "rgba(0, 255, 0, 0.3)",
        };
        
        setHighlights([...highlights, newHighlight]);
      }
    }
  }, [selectionDimensions]);

  // Field management
  const currentPageTemplate = templates[currentPage] || [];

  const addField = () => {
    const label = prompt("Enter field label:");
    if (!label) return;
    
    const id = label.toLowerCase().replace(/\s+/g, "_");
    const newField = { id, label };
    
    setTemplates({
      ...templates,
      [currentPage]: [...currentPageTemplate, newField],
    });
  };

  const removeField = (fieldId: string) => {
    setTemplates({
      ...templates,
      [currentPage]: currentPageTemplate.filter((f) => f.id !== fieldId),
    });
    
    const newPageForm = { ...pageForm };
    delete newPageForm[`${currentPage}:${fieldId}`];
    setPageForm(newPageForm);
  };

  const updateFieldValue = (fieldId: string, value: string) => {
    setPageForm({
      ...pageForm,
      [`${currentPage}:${fieldId}`]: value,
    });
  };

  const goToHighlight = (h: LabeledHighlight) => {
    jumpToPage(h.pageNumber);
  };

  const editHighlight = (h: LabeledHighlight) => {
    const newLabel = prompt("Edit label:", h.label);
    if (newLabel) {
      setHighlights(
        highlights.map((item) =>
          item.id === h.id ? { ...item, label: newLabel } : item
        )
      );
    }
  };

  const deleteHighlight = (id: string) => {
    setHighlights(highlights.filter((h) => h.id !== id));
  };

  return (
    <div className="flex h-screen">
      {/* Right Sidebar */}
      <div className="w-80 bg-gray-50 border-l p-4 overflow-y-auto flex flex-col gap-4">
        {/* Page Navigation */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Page</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => jumpToPage(Math.max(1, currentPage - 1))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={currentPage <= 1}
            >
              ◀
            </button>
            <span className="text-sm">
              {currentPage} / {totalPages || 1}
            </span>
            <button
              onClick={() => jumpToPage(Math.min(totalPages || 1, currentPage + 1))}
              className="px-3 py-1 border rounded hover:bg-gray-100"
              disabled={currentPage >= (totalPages || 1)}
            >
              ▶
            </button>
          </div>
        </div>

        {/* Field Template */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-semibold">Fields for page {currentPage}</label>
            <button
              onClick={addField}
              className="px-2 py-1 text-sm border rounded hover:bg-gray-100"
            >
              + field
            </button>
          </div>
          
          {currentPageTemplate.map((field) => (
            <div key={field.id} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{field.label}</label>
                <button
                  onClick={() => removeField(field.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={pageForm[`${currentPage}:${field.id}`] || ""}
                onChange={(e) => updateFieldValue(field.id, e.target.value)}
                className="px-2 py-1 border rounded text-sm"
              />
            </div>
          ))}
        </div>

        {/* Highlights List */}
        <div className="flex flex-col gap-2">
          <label className="font-semibold">Your Highlights</label>
          {highlights.length === 0 && (
            <p className="text-sm text-gray-500">No highlights yet.</p>
          )}
          {highlights.map((h) => (
            <div key={h.id} className="p-2 border rounded bg-white text-sm">
              <div className="font-medium">{h.label}</div>
              <div className="text-xs text-gray-500">Page {h.pageNumber}</div>
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => goToHighlight(h)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Go
                </button>
                <button
                  onClick={() => editHighlight(h)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteHighlight(h.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Del
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Search Results Info */}
        {searchResults && searchResults.exactMatches.length > 0 && (
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Search Results</label>
            <p className="text-sm text-gray-600">
              Found {searchResults.exactMatches.length} matches
            </p>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        <Pages className="p-4 h-full overflow-auto">
          <Page>
            <CanvasLayer />
            <TextLayer />
            <AnnotationLayer />
            <ColoredHighlightLayer highlights={allHighlights} />
          </Page>
        </Pages>
      </div>
    </div>
  );
}

// ===== MAIN APP =====

export default function App() {
  const [projects, setProjects] = useState<string[]>(loadProjects());
  const [currentProject, setCurrentProject] = useState<string>(loadCurrentProject());
  const [source, setSource] = useState<string>("/sample.pdf");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [highlights, setHighlights] = useState<LabeledHighlight[]>([]);
  const [pageForm, setPageForm] = useState<PageFormData>({});
  const [templates, setTemplates] = useState<Templates>({});

  // Load project data
  useEffect(() => {
    setHighlights(loadHighlights(currentProject));
    setPageForm(loadPageForm(currentProject));
    setTemplates(loadTemplates(currentProject));
  }, [currentProject]);

  // Save data on changes
  useEffect(() => {
    saveHighlights(currentProject, highlights);
  }, [currentProject, highlights]);

  useEffect(() => {
    savePageForm(currentProject, pageForm);
  }, [currentProject, pageForm]);

  useEffect(() => {
    saveTemplates(currentProject, templates);
  }, [currentProject, templates]);

  // Project management
  const addProject = () => {
    const name = prompt("Enter project name:");
    if (!name || projects.includes(name)) return;
    
    const newProjects = [...projects, name];
    setProjects(newProjects);
    saveProjects(newProjects);
    setCurrentProject(name);
    saveCurrentProject(name);
  };

  const deleteProject = () => {
    if (currentProject === "default") {
      alert("Cannot delete the default project");
      return;
    }
    
    if (!confirm(`Delete project "${currentProject}"?`)) return;
    
    const newProjects = projects.filter((p) => p !== currentProject);
    setProjects(newProjects);
    saveProjects(newProjects);
    
    // Clear project data
    localStorage.removeItem(key(currentProject, "highlights"));
    localStorage.removeItem(key(currentProject, "pageForm"));
    localStorage.removeItem(key(currentProject, "templates"));
    
    setCurrentProject("default");
    saveCurrentProject("default");
  };

  const switchProject = (name: string) => {
    setCurrentProject(name);
    saveCurrentProject(name);
  };

  // Export functions
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
    a.download = `${currentProject}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows: string[][] = [
      ["Project", "Type", "Page", "Field", "Label", "Value", "x", "y", "width", "height"],
    ];
    
    // Add highlights
    highlights.forEach((h) => {
      rows.push([
        currentProject,
        "highlight",
        h.pageNumber.toString(),
        "",
        h.label,
        "",
        h.x.toString(),
        h.y.toString(),
        h.width.toString(),
        h.height.toString(),
      ]);
    });
    
    // Add form data
    Object.entries(pageForm).forEach(([key, value]) => {
      const [page, field] = key.split(":");
      const template = templates[Number.parseInt(page)]?.find((f) => f.id === field);
      rows.push([
        currentProject,
        "field",
        page,
        field,
        template?.label || field,
        value,
        "",
        "",
        "",
        "",
      ]);
    });
    
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentProject}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b p-4">
        <h1 className="text-2xl font-bold">Lector Review</h1>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-gray-50 border-r p-4 overflow-y-auto flex flex-col gap-4">
          {/* Project Selector */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Project</label>
            <div className="flex gap-2">
              <select
                value={currentProject}
                onChange={(e) => switchProject(e.target.value)}
                className="flex-1 px-2 py-1 border rounded"
              >
                {projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <button
                onClick={addProject}
                className="px-2 border rounded hover:bg-gray-100"
              >
                +
              </button>
              <button
                onClick={deleteProject}
                className="px-2 border rounded hover:bg-gray-100"
              >
                🗑
              </button>
            </div>
          </div>

          {/* PDF Source */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">PDF Source</label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="/sample.pdf"
            />
          </div>

          {/* Search */}
          <div className="flex flex-col gap-2">
            <label className="font-semibold">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-2 py-1 border rounded text-sm"
              placeholder="Search in PDF..."
            />
          </div>

          {/* Export Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={exportJSON}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export JSON
            </button>
            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* PDF Viewer with Hooks */}
        <Root source={source} className="flex-1">
          <PDFViewerContent
            currentProject={currentProject}
            highlights={highlights}
            setHighlights={setHighlights}
            pageForm={pageForm}
            setPageForm={setPageForm}
            templates={templates}
            setTemplates={setTemplates}
            searchTerm={searchTerm}
          />
        </Root>
      </div>
    </div>
  );
}
