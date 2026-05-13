import type { VaultFile } from "@/types/vault";

export const mockVaultFiles: VaultFile[] = [
	{
		path: "projekte",
		name: "projekte",
		title: "Projekte",
		type: "directory",
		children: [
			{
				path: "projekte/aurora-design-system",
				name: "aurora-design-system.md",
				title: "Aurora Design System",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Aurora Design System",
					status: "active",
					client: "nova-fintech-ag",
					tags: ["design-system", "ui", "figma", "tokens", "react"],
					date: "2025-02-10",
				},
				content: `---
title: Aurora Design System
status: active
client: nova-fintech-ag
tags: [design-system, ui, figma, tokens, react]
date: 2025-02-10
---

# Aurora Design System

Aufbau eines unternehmensweiten Design Systems für Nova Fintech AG.

## Status

| Milestone | Fortschritt |
|-----------|------------|
| Foundations definiert | ✅ Abgeschlossen |
| Figma Component Library | ✅ Abgeschlossen |
| React: Atoms | ✅ Abgeschlossen |
| React: Molecules | 🔄 In Arbeit (70%) |
| Storybook Docs | 🔄 In Arbeit (50%) |
`,
			},
			{
				path: "projekte/portfolio-website-2025",
				name: "portfolio-website-2025.md",
				title: "Portfolio Website 2025",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Portfolio Website 2025",
					status: "in-progress",
					tags: ["portfolio", "nextjs", "framer-motion", "personal"],
					date: "2025-03-01",
				},
				content: `---
title: Portfolio Website 2025
status: in-progress
tags: [portfolio, nextjs, framer-motion, personal]
date: 2025-03-01
---

# Portfolio Website 2025

Kompletter Neuaufbau meiner Portfolio-Website. Fokus auf Performance, minimalistische Ästhetik und flüssige Animationen.
`,
			},
			{
				path: "projekte/freelens-app",
				name: "freelens-app.md",
				title: "FreeLens — Mobile Foto-App",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "FreeLens — Mobile Foto-App",
					status: "completed",
					client: "luminary-studios",
					tags: ["mobile", "ux", "ios", "figma", "case-study"],
					date: "2024-10-15",
				},
				content: `---
title: FreeLens — Mobile Foto-App
status: completed
client: luminary-studios
tags: [mobile, ux, ios, figma, case-study]
date: 2024-10-15
---

# FreeLens — Mobile Foto-App

UX-Konzept und vollständiges UI-Design für FreeLens, eine iOS-App für analoge Fotograf:innen.
`,
			},
		],
	},
	{
		path: "kunden",
		name: "kunden",
		title: "Kunden",
		type: "directory",
		children: [
			{
				path: "kunden/nova-fintech-ag",
				name: "nova-fintech-ag.md",
				title: "Nova Fintech AG",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Nova Fintech AG",
					type: "client",
					contact: "Lena Brandt",
					email: "l.brandt@nova-fintech.de",
					hourlyRate: 145,
					status: "active",
				},
				content: `---
title: Nova Fintech AG
type: client
contact: Lena Brandt
email: l.brandt@nova-fintech.de
hourlyRate: 145
status: active
since: 2024-09-01
---

# Nova Fintech AG

Fintech-Startup aus Berlin. Baut eine B2B-Plattform für automatisiertes Treasury-Management.
`,
			},
			{
				path: "kunden/luminary-studios",
				name: "luminary-studios.md",
				title: "Luminary Studios",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Luminary Studios",
					type: "client",
					contact: "Marc Osei",
					email: "marc@luminary.studio",
					hourlyRate: 120,
					status: "active",
				},
				content: `---
title: Luminary Studios
type: client
contact: Marc Osei
email: marc@luminary.studio
hourlyRate: 120
status: active
since: 2024-06-01
---

# Luminary Studios

Kreativagentur aus München mit Fokus auf Brand Identity und digitale Produktentwicklung.
`,
			},
		],
	},
	{
		path: "notizen",
		name: "notizen",
		title: "Notizen",
		type: "directory",
		children: [
			{
				path: "notizen/daily",
				name: "daily",
				title: "Daily Notes",
				type: "directory",
				children: [
					{
						path: "notizen/daily/2025-05-12",
						name: "2025-05-12.md",
						title: "12. Mai 2025",
						type: "file",
						extension: "md",
						frontmatter: { title: "12. Mai 2025", date: "2025-05-12", type: "daily" },
						content: `---
title: 12. Mai 2025
date: 2025-05-12
type: daily
---

# Montag, 12. Mai 2025

## Prioritäten

1. \`DataTable\`-Komponente (Aurora)
2. Rechnung Mai an Nova Fintech schreiben
3. Angebot für neuen Interessenten
`,
					},
					{
						path: "notizen/daily/2025-05-11",
						name: "2025-05-11.md",
						title: "11. Mai 2025",
						type: "file",
						extension: "md",
						frontmatter: { title: "11. Mai 2025", date: "2025-05-11", type: "daily" },
						content: `---
title: 11. Mai 2025
date: 2025-05-11
type: daily
---

# Sonntag, 11. Mai 2025

Kein Kundenprojekt heute — eigene Projekte und Lernen.
`,
					},
					{
						path: "notizen/daily/2025-05-10",
						name: "2025-05-10.md",
						title: "10. Mai 2025",
						type: "file",
						extension: "md",
						frontmatter: { title: "10. Mai 2025", date: "2025-05-10", type: "daily" },
						content: `---
title: 10. Mai 2025
date: 2025-05-10
type: daily
---

# Samstag, 10. Mai 2025

Deep Work an Aurora — Molecule-Komponenten abschließen.
`,
					},
				],
			},
			{
				path: "notizen/ideen",
				name: "ideen",
				title: "Ideen",
				type: "directory",
				children: [
					{
						path: "notizen/ideen/micro-saas-ideen",
						name: "micro-saas-ideen.md",
						title: "Micro-SaaS Ideen",
						type: "file",
						extension: "md",
						frontmatter: {
							title: "Micro-SaaS Ideen",
							type: "brainstorm",
							tags: ["saas", "produktideen", "business"],
						},
						content: `---
title: Micro-SaaS Ideen
type: brainstorm
tags: [saas, produktideen, business]
---

# Micro-SaaS Ideen

Sammlung von Produkt-Ideen: Token Studio CLI, Invoice Kit, Design Review Tool, A11y Figma Plugin.
`,
					},
					{
						path: "notizen/ideen/design-system-toolkit",
						name: "design-system-toolkit.md",
						title: "Design System Toolkit — Konzept",
						type: "file",
						extension: "md",
						frontmatter: {
							title: "Design System Toolkit — Konzept",
							type: "konzept",
							tags: ["design-system", "open-source", "tooling"],
						},
						content: `---
title: Design System Toolkit — Konzept
type: konzept
tags: [design-system, open-source, tooling]
---

# Design System Toolkit

Open-Source Toolkit für schnelleren Design-System-Aufbau.
`,
					},
				],
			},
		],
	},
	{
		path: "ressourcen",
		name: "ressourcen",
		title: "Ressourcen",
		type: "directory",
		children: [
			{
				path: "ressourcen/figma-plugins",
				name: "figma-plugins.md",
				title: "Figma Plugins — Meine Toolbox",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Figma Plugins — Meine Toolbox",
					type: "referenz",
					tags: ["figma", "tools", "workflow"],
				},
				content: `---
title: Figma Plugins — Meine Toolbox
type: referenz
tags: [figma, tools, workflow]
---

# Figma Plugins

Tokens Studio, Iconify, Stark, Measure, Variables Import — und mehr.
`,
			},
			{
				path: "ressourcen/typografie-referenz",
				name: "typografie-referenz.md",
				title: "Typografie-Referenz",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Typografie-Referenz",
					type: "referenz",
					tags: ["typografie", "fonts", "design"],
				},
				content: `---
title: Typografie-Referenz
type: referenz
tags: [typografie, fonts, design]
---

# Typografie-Referenz

Cabinet Grotesk, Instrument Sans, Geist Mono — Favoriten und Pairings.
`,
			},
			{
				path: "ressourcen/color-palettes",
				name: "color-palettes.md",
				title: "Farbpaletten — Inspiration & Referenz",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Farbpaletten — Inspiration & Referenz",
					type: "referenz",
					tags: ["farben", "design", "tokens"],
				},
				content: `---
title: Farbpaletten — Inspiration & Referenz
type: referenz
tags: [farben, design, tokens]
---

# Farbpaletten

Aurora-Palette, Nordic Moss, WCAG-Kontrastvorgaben und nützliche Tools.
`,
			},
		],
	},
	{
		path: "archiv",
		name: "archiv",
		title: "Archiv",
		type: "directory",
		children: [
			{
				path: "archiv/projekt-stadtbibliothek-2024",
				name: "projekt-stadtbibliothek-2024.md",
				title: "Stadtbibliothek Neustadt — Website Relaunch",
				type: "file",
				extension: "md",
				frontmatter: {
					title: "Stadtbibliothek Neustadt — Website Relaunch",
					status: "completed",
					tags: ["webdesign", "accessibility", "cms", "kultureinrichtung"],
					date: "2024-05-01",
				},
				content: `---
title: Stadtbibliothek Neustadt — Website Relaunch
status: completed
tags: [webdesign, accessibility, cms, kultureinrichtung]
date: 2024-05-01
---

# Stadtbibliothek Neustadt — Website Relaunch

BITV 2.0-konformer Website-Relaunch. Live seit Oktober 2024.
`,
			},
		],
	},
];

export function findVaultFile(path: string): VaultFile | null {
	const segments = path.split("/").filter(Boolean);
	let current: VaultFile[] = mockVaultFiles;
	let found: VaultFile | null = null;

	for (let i = 0; i < segments.length; i++) {
		const targetPath = segments.slice(0, i + 1).join("/");
		found = current.find((f) => f.path === targetPath) || null;
		if (!found) return null;
		if (found.type === "directory" && found.children) {
			current = found.children;
		}
	}

	return found;
}

export function getVaultBreadcrumbs(path: string): Array<{ name: string; path: string }> {
	const segments = path.split("/").filter(Boolean);
	return segments.map((_, i) => {
		const currentPath = segments.slice(0, i + 1).join("/");
		const file = findVaultFile(currentPath);
		return { name: file?.title || segments[i], path: currentPath };
	});
}

export function flattenVaultTree(files: VaultFile[] = mockVaultFiles): VaultFile[] {
	const result: VaultFile[] = [];
	function traverse(items: VaultFile[]) {
		for (const item of items) {
			result.push(item);
			if (item.children) traverse(item.children);
		}
	}
	traverse(files);
	return result;
}
