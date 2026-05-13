import type {
	ProductIdea,
	IdeaStatus,
	ProductIdeaFrontmatter,
} from "@/types/produkt-ideen";

export let mockProductIdeas: ProductIdea[] = [
	{
		id: "idea-1",
		slug: "figma-to-code-template-pack",
		title: "Figma-to-Code Template Pack",
		description:
			"Ein Paket von handgefertigten Figma-Templates mit direkt nutzbarem React/Next.js Code. Design-Token-basiert, responsive, accessibility-ready.",
		category: "Template",
		categorySlug: "template",
		status: "validating",
		targetAudience: "Freelance Designer die auch coden",
		potentialRevenue: "einmalig, 29-49 EUR",
		effortEstimate: "2 Wochen",
		priority: "high",
		tags: ["figma", "templates", "design-to-code"],
		notes: "Konkurrenzanalyse zeigt Luecke im Markt fuer deutsche Freelancer.",
		body: "",
		createdAt: new Date("2024-01-15"),
		updatedAt: new Date("2024-02-01"),
	},
	{
		id: "idea-2",
		slug: "mehub",
		title: "MeHub",
		description:
			"Ein persoenliches Produktivitaets-System das Obsidian, GitHub und eine Web-App verbindet. Zeiterfassung, Ideenmanagement, Content-Pipeline.",
		category: "SaaS",
		categorySlug: "saas",
		status: "building",
		targetAudience: "Freelancer und Solo-Entrepreneure",
		potentialRevenue: "Open Source / eigene Nutzung",
		effortEstimate: "8-12 Wochen",
		priority: "high",
		tags: ["productivity", "obsidian", "nextjs"],
		notes: "Primaer fuer eigene Nutzung, spaeter evtl. Template-Version.",
		body: "",
		createdAt: new Date("2024-01-01"),
		updatedAt: new Date("2024-02-15"),
	},
	{
		id: "idea-3",
		slug: "notion-template-pack-freelancer",
		title: "Notion Template Pack fuer Freelancer",
		description:
			"Sammlung von Notion-Templates: CRM, Projektmanagement, Rechnungen, Zeiterfassung. Alles integriert.",
		category: "Template",
		categorySlug: "template",
		status: "idea",
		targetAudience: "Deutsche Freelancer",
		potentialRevenue: "einmalig, 19-39 EUR",
		effortEstimate: "1 Woche",
		priority: "medium",
		tags: ["notion", "templates", "freelancer"],
		notes: "Markt ist gesaettigt, Differenzierung durch deutschen Support?",
		body: "",
		createdAt: new Date("2024-02-01"),
		updatedAt: new Date("2024-02-01"),
	},
	{
		id: "idea-4",
		slug: "ai-content-generator",
		title: "AI Content Generator",
		description:
			"Tool das aus einem Briefing Social Media Posts, Newsletter-Texte und Blog-Artikel generiert. Mit Brand Voice Training.",
		category: "SaaS",
		categorySlug: "saas",
		status: "idea",
		targetAudience: "Content Creator, Marketing Teams",
		potentialRevenue: "MRR, 29 EUR/Monat",
		effortEstimate: "6-8 Wochen",
		priority: "low",
		tags: ["ai", "content", "marketing"],
		notes:
			"Viele Konkurrenten, aber Fokus auf deutschen Markt koennte funktionieren.",
		body: "",
		createdAt: new Date("2024-02-10"),
		updatedAt: new Date("2024-02-10"),
	},
	{
		id: "idea-5",
		slug: "invoice-generator-cli",
		title: "Invoice Generator CLI",
		description:
			"Command-Line-Tool zum Generieren von professionellen PDF-Rechnungen aus YAML/JSON. Integration mit Zeiterfassung.",
		category: "Tool",
		categorySlug: "tool",
		status: "parked",
		targetAudience: "Entwickler-Freelancer",
		potentialRevenue: "Open Source, Donations",
		effortEstimate: "2-3 Wochen",
		priority: "low",
		tags: ["cli", "invoicing", "developer-tools"],
		notes: "Nische zu klein? Evtl. als Teil von MeHub integrieren.",
		body: "",
		createdAt: new Date("2023-12-01"),
		updatedAt: new Date("2024-01-15"),
	},
	{
		id: "idea-6",
		slug: "design-system-course",
		title: "Design System Course",
		description:
			"Video-Kurs ueber Aufbau und Pflege von Design Systems. Von Figma ueber Tokens bis zur Code-Implementation.",
		category: "Course",
		categorySlug: "course",
		status: "idea",
		targetAudience: "Mid-level Designer",
		potentialRevenue: "einmalig, 149-249 EUR",
		effortEstimate: "4-6 Wochen",
		priority: "medium",
		tags: ["course", "design-systems", "education"],
		notes: "Erst nach Launch von anderen Produkten als Authority-Builder.",
		body: "",
		createdAt: new Date("2024-02-05"),
		updatedAt: new Date("2024-02-05"),
	},
];

export function getIdeasByStatus(status: IdeaStatus): ProductIdea[] {
	return mockProductIdeas.filter((idea) => idea.status === status);
}

export function getIdeaById(id: string): ProductIdea | undefined {
	return mockProductIdeas.find((idea) => idea.id === id);
}

export function addProductIdea(data: ProductIdea): ProductIdea {
	const newIdea: ProductIdea = {
		...data,
		id: `idea-${Date.now()}`,
		slug: data.slug || `idea-${Date.now()}`,
		categorySlug: data.categorySlug || data.category.toLowerCase(),
		body: data.body || "",
		createdAt: new Date(),
		updatedAt: new Date(),
	};
	mockProductIdeas = [newIdea, ...mockProductIdeas];
	return newIdea;
}

export function updateProductIdea(
	id: string,
	updates: Partial<ProductIdea>,
): ProductIdea | null {
	const index = mockProductIdeas.findIndex((idea) => idea.id === id);
	if (index === -1) return null;

	mockProductIdeas[index] = {
		...mockProductIdeas[index],
		...updates,
		updatedAt: new Date(),
	};
	return mockProductIdeas[index];
}

export function updateIdeaStatus(
	id: string,
	status: IdeaStatus,
): ProductIdea | null {
	return updateProductIdea(id, { status });
}

export function deleteProductIdea(id: string): boolean {
	const index = mockProductIdeas.findIndex((idea) => idea.id === id);
	if (index === -1) return false;

	mockProductIdeas.splice(index, 1);
	return true;
}
