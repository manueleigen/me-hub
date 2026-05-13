export type IdeaStatus =
	| "idea"
	| "validating"
	| "building"
	| "launched"
	| "parked";
export type IdeaPriority = "low" | "medium" | "high";

export const IDEA_CATEGORIES = [
	"Digital-Produkt",
	"Digital-Tools",
	"Furniture",
	"Objekte",
	"Designs",
	"SaaS",
	"Template",
	"Course",
	"Tool",
	"Sonstiges",
] as const;

export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export interface ProductIdeaFrontmatter {
	id?: string;
	title: string;
	description: string;
	category: string;
	status: IdeaStatus;
	priority: IdeaPriority;
	targetAudience?: string;
	potentialRevenue?: string;
	effortEstimate?: string;
	tags: string[];
	notes?: string;
	createdAt?: Date;
	updatedAt?: Date;
}

export interface ProductIdea extends ProductIdeaFrontmatter {
	slug: string;
	categorySlug: string;
	sha?: string;
	body: string;
}

export const STATUS_CONFIG: Record<
	IdeaStatus,
	{ label: string; color: string }
> = {
	idea: { label: "Idee", color: "bg-slate-500" },
	validating: { label: "Validierung", color: "bg-amber-500" },
	building: { label: "In Entwicklung", color: "bg-blue-500" },
	launched: { label: "Live", color: "bg-green-500" },
	parked: { label: "Pausiert", color: "bg-gray-400" },
};

export const PRIORITY_CONFIG: Record<
	IdeaPriority,
	{ label: string; color: string }
> = {
	low: { label: "Niedrig", color: "text-slate-500" },
	medium: { label: "Mittel", color: "text-amber-500" },
	high: { label: "Hoch", color: "text-red-500" },
};

export const CATEGORY_CONFIG: Record<string, { label: string }> = {
	"Digital-Produkt": { label: "Digital-Produkt" },
	"Digital-Tools": { label: "Digital-Tools" },
	Furniture: { label: "Furniture" },
	Objekte: { label: "Objekte" },
	Designs: { label: "Designs" },
	SaaS: { label: "SaaS" },
	Template: { label: "Template" },
	Course: { label: "Kurs" },
	Tool: { label: "Tool" },
	Sonstiges: { label: "Sonstiges" },
	Other: { label: "Sonstiges" },
};
