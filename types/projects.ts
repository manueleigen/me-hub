export type ProjectType = "freelance" | "job" | "personal";

export interface ProjectFrontmatter {
  type: ProjectType;
  client?: string;
  clientName?: string;
  title: string;
  category: string[];
  skills: string[];
  tools: string[];
  area: string[];
  status?: string;
  date?: string;
}

export interface Project extends ProjectFrontmatter {
  slug: string;
  sha?: string;
  body: string;
}
