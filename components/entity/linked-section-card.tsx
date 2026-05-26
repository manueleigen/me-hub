"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StatusConfigMap } from "@/lib/entity/types";

type LinkedSectionCardProps<T> = {
	title: ReactNode;
	icon?: ReactNode;
	linkHref?: string;
	linkLabel?: string;
	headerActions?: ReactNode;
	emptyMessage: string;
	items: T[];
	getItemKey: (item: T) => string;
	renderItem: (item: T) => ReactNode;
	/** Max items before „Mehr anzeigen“ (local expand). */
	previewLimit?: number;
	showAllHref?: string;
	showAllLabel?: string;
	footerHint?: ReactNode;
};

/** List section with optional header link — projects, related tasks, time entries, etc. */
export function LinkedSectionCard<T>({
	title,
	icon,
	linkHref,
	linkLabel,
	headerActions,
	emptyMessage,
	items,
	getItemKey,
	renderItem,
	previewLimit,
	showAllHref,
	showAllLabel = "Alle anzeigen",
	footerHint,
}: LinkedSectionCardProps<T>) {
	const [expanded, setExpanded] = useState(false);
	const hasPreviewLimit =
		previewLimit != null && previewLimit > 0 && items.length > previewLimit;
	const visibleItems =
		hasPreviewLimit && !expanded ? items.slice(0, previewLimit) : items;
	const hiddenCount = hasPreviewLimit ? items.length - previewLimit! : 0;

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex items-center justify-between gap-2">
					<CardTitle className="text-base flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<div className="flex items-center gap-2">
						{headerActions}
						{linkHref && linkLabel ? (
							<Link
								href={linkHref}
								className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
							>
								{linkLabel}
								<ExternalLink className="size-3" />
							</Link>
						) : null}
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{items.length === 0 ? (
					<p className="text-sm text-muted-foreground">{emptyMessage}</p>
				) : (
					<>
						<div className="space-y-2">
							{visibleItems.map((item) => (
								<div key={getItemKey(item)}>{renderItem(item)}</div>
							))}
						</div>
						{hasPreviewLimit ? (
							<div className="flex flex-wrap items-center gap-2 pt-1">
								{!expanded ? (
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="h-8 text-xs"
										onClick={() => setExpanded(true)}
									>
										<ChevronDown className="size-3.5 mr-1" />
										Mehr anzeigen ({hiddenCount})
									</Button>
								) : null}
								{showAllHref ? (
									<Button
										variant="ghost"
										size="sm"
										className="h-8 text-xs"
										asChild
									>
										<Link href={showAllHref}>
											{showAllLabel}
											<ExternalLink className="size-3 ml-1" />
										</Link>
									</Button>
								) : null}
							</div>
						) : null}
						{footerHint ? (
							<p className="text-xs text-muted-foreground">{footerHint}</p>
						) : null}
					</>
				)}
			</CardContent>
		</Card>
	);
}

type LinkedRowProps = {
	href: string;
	title: string;
	subtitle?: string;
};

export function LinkedRow({ href, title, subtitle }: LinkedRowProps) {
	return (
		<Link
			href={href}
			className="flex items-center justify-between rounded-md border px-3 py-2 hover:bg-muted transition-colors"
		>
			<div className="min-w-0">
				<p className="text-sm font-medium truncate">{title}</p>
				{subtitle ? (
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				) : null}
			</div>
			<ExternalLink className="size-3.5 text-muted-foreground shrink-0 ml-2" />
		</Link>
	);
}

type RelatedLinksSectionProps<T> = {
	title: ReactNode;
	icon?: ReactNode;
	linkHref: string;
	linkLabel: string;
	emptyMessage: string;
	items: T[];
	getItemKey: (item: T) => string;
	getHref: (item: T) => string;
	getTitle: (item: T) => string;
	getSubtitle?: (item: T) => string;
	statusConfig?: StatusConfigMap;
	getStatus?: (item: T) => string;
};

/** Shortcut for link rows with optional status subtitle (tasks, ideas). */
export function RelatedLinksSection<T>({
	title,
	icon,
	linkHref,
	linkLabel,
	emptyMessage,
	items,
	getItemKey,
	getHref,
	getTitle,
	getSubtitle,
	statusConfig,
	getStatus,
}: RelatedLinksSectionProps<T>) {
	return (
		<LinkedSectionCard
			title={title}
			icon={icon}
			linkHref={linkHref}
			linkLabel={linkLabel}
			emptyMessage={emptyMessage}
			items={items}
			getItemKey={getItemKey}
			renderItem={(item) => (
				<LinkedRow
					href={getHref(item)}
					title={getTitle(item)}
					subtitle={
						getSubtitle?.(item) ??
						(getStatus && statusConfig
							? (statusConfig[getStatus(item)]?.label ?? getStatus(item))
							: undefined)
					}
				/>
			)}
		/>
	);
}
