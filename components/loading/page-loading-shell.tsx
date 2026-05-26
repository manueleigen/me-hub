import { AppHeader } from "@/components/layout/app-header";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PageLoadingVariant =
	| "grid"
	| "kanban"
	| "table"
	| "detail"
	| "vault"
	| "stats"
	| "simple";

type Breadcrumb = { label: string; href?: string };

export function PageLoadingShell({
	breadcrumbs,
	title,
	description,
	variant = "simple",
	className,
}: {
	breadcrumbs: Breadcrumb[];
	title: string;
	description?: string;
	variant?: PageLoadingVariant;
	className?: string;
}) {
	return (
		<>
			<AppHeader breadcrumbs={breadcrumbs} />
			<div className={cn("flex-1 overflow-auto p-6", className)}>
				<div className="mb-6 flex items-start justify-between gap-4">
					<div className="space-y-2">
						{title ? (
							<h1 className="text-2xl font-bold tracking-tight">{title}</h1>
						) : (
							<Skeleton className="h-8 w-48" />
						)}
						{description ? (
							<p className="text-muted-foreground">{description}</p>
						) : (
							<Skeleton className="h-4 w-64" />
						)}
					</div>
					<Skeleton className="h-10 w-36 shrink-0" />
				</div>
				<LoadingVariantBody variant={variant} />
			</div>
		</>
	);
}

function LoadingVariantBody({ variant }: { variant: PageLoadingVariant }) {
	switch (variant) {
		case "stats":
			return (
				<div className="space-y-6">
					<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{Array.from({ length: 4 }).map((_, i) => (
							<Skeleton key={i} className="h-24 w-full rounded-lg" />
						))}
					</div>
					<Skeleton className="h-10 w-full max-w-md" />
					<KanbanSkeleton />
				</div>
			);
		case "kanban":
			return (
				<div className="space-y-4">
					<Skeleton className="h-10 w-64" />
					<KanbanSkeleton />
				</div>
			);
		case "table":
			return (
				<div className="space-y-4">
					<Skeleton className="h-10 w-full max-w-sm" />
					<div className="space-y-2">
						{Array.from({ length: 8 }).map((_, i) => (
							<Skeleton key={i} className="h-12 w-full rounded-md" />
						))}
					</div>
				</div>
			);
		case "grid":
			return (
				<div className="space-y-4">
					<div className="flex gap-3">
						<Skeleton className="h-10 w-64" />
						<Skeleton className="h-10 w-48" />
					</div>
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-40 w-full rounded-lg" />
						))}
					</div>
				</div>
			);
		case "vault":
			return (
				<div className="space-y-6">
					<div className="grid gap-4 md:grid-cols-3">
						{Array.from({ length: 3 }).map((_, i) => (
							<Skeleton key={i} className="h-28 w-full rounded-lg" />
						))}
					</div>
					<Skeleton className="h-64 w-full rounded-lg" />
				</div>
			);
		case "detail":
			return (
				<div className="space-y-6">
					<Skeleton className="h-32 w-full rounded-lg" />
					<div className="grid gap-4 md:grid-cols-2">
						<Skeleton className="h-48 w-full rounded-lg" />
						<Skeleton className="h-48 w-full rounded-lg" />
					</div>
				</div>
			);
		default:
			return (
				<div className="space-y-3">
					{Array.from({ length: 5 }).map((_, i) => (
						<Skeleton key={i} className="h-10 w-full rounded-md" />
					))}
				</div>
			);
	}
}

function KanbanSkeleton() {
	return (
		<div className="flex gap-4 overflow-hidden">
			{Array.from({ length: 4 }).map((_, col) => (
				<div key={col} className="min-w-[240px] flex-1 space-y-3">
					<Skeleton className="h-8 w-full rounded-md" />
					{Array.from({ length: 3 }).map((_, card) => (
						<Skeleton key={card} className="h-24 w-full rounded-lg" />
					))}
				</div>
			))}
		</div>
	);
}
