/**
 * Import/Export utilities for project data
 */

export interface ProjectData {
  project: string;
  source: string;
  highlights: any[];
  templates: Record<number, any[]>;
  pageForm: Record<string, string>;
  exportedAt: string;
}

/**
 * Export project data as JSON
 */
export function exportProjectJSON(data: ProjectData): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.project}_export_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export project data as CSV
 */
export function exportProjectCSV(data: ProjectData): void {
  const rows: string[][] = [
    ["Project", "Page", "Field", "Value", "Highlight Label", "Highlight Page"],
  ];

  // Add form data
  Object.entries(data.pageForm).forEach(([key, value]) => {
    const [page, field] = key.split(":");
    rows.push([data.project, page, field, value, "", ""]);
  });

  // Add highlights
  data.highlights.forEach((h: any) => {
    rows.push([data.project, "", "", "", h.label, String(h.pageNumber)]);
  });

  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.project}_export_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import project data from JSON file
 */
export async function importProjectJSON(file: File): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content) as ProjectData;

        // Validate required fields
        if (
          !data.project ||
          !data.highlights ||
          !data.templates ||
          !data.pageForm
        ) {
          throw new Error("Invalid project data format");
        }

        resolve(data);
      } catch (error) {
        reject(
          new Error("Failed to parse JSON file: " + (error as Error).message)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Export all projects as a single JSON file
 */
export function exportAllProjects(projects: Record<string, ProjectData>): void {
  const data = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    projects,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `all_projects_backup_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import all projects from a backup file
 */
export async function importAllProjects(
  file: File
): Promise<Record<string, ProjectData>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate format
        if (!data.projects || typeof data.projects !== "object") {
          throw new Error("Invalid backup file format");
        }

        resolve(data.projects);
      } catch (error) {
        reject(
          new Error("Failed to parse backup file: " + (error as Error).message)
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/**
 * Generate a summary report of extracted data
 */
export function generateSummaryReport(data: ProjectData): string {
  const lines: string[] = [];

  lines.push(`# Extraction Summary: ${data.project}`);
  lines.push(`Generated: ${new Date().toLocaleString()}`);
  lines.push("");

  lines.push("## Highlights");
  lines.push(`Total: ${data.highlights.length}`);
  data.highlights.forEach((h: any, idx: number) => {
    lines.push(`${idx + 1}. [Page ${h.pageNumber}] ${h.label}`);
  });
  lines.push("");

  lines.push("## Extracted Data");
  const pageData: Record<number, Array<[string, string]>> = {};

  Object.entries(data.pageForm).forEach(([key, value]) => {
    const [pageStr, field] = key.split(":");
    const page = parseInt(pageStr);
    if (!pageData[page]) pageData[page] = [];
    pageData[page].push([field, value]);
  });

  Object.keys(pageData)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .forEach((pageStr) => {
      const page = parseInt(pageStr);
      lines.push(`### Page ${page}`);
      pageData[page].forEach(([field, value]) => {
        lines.push(`- **${field}**: ${value}`);
      });
      lines.push("");
    });

  return lines.join("\n");
}

/**
 * Export summary report as markdown
 */
export function exportSummaryReport(data: ProjectData): void {
  const report = generateSummaryReport(data);
  const blob = new Blob([report], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${data.project}_summary_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
