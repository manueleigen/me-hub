import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { DetailField } from "@/components/entity-detail/detail-field";
import type {
	PriorityConfigMap,
	StatusConfigMap,
} from "@/lib/entity/types";
import { cn } from "@/lib/utils";

export function StatusPriorityDetailFields({
	status,
	priority,
	statusConfig,
	priorityConfig,
}: {
	status: string;
	priority: string;
	statusConfig: StatusConfigMap;
	priorityConfig: PriorityConfigMap;
}) {
	const statusCfg = statusConfig[status];
	const priorityCfg = priorityConfig[priority];

	return (
		<>
			<DetailField label="Status">
				<Badge className={cn("text-white", statusCfg?.color)}>
					{statusCfg?.label ?? status}
				</Badge>
			</DetailField>
			<DetailField label="Priorität">
				<span className={cn("font-medium", priorityCfg?.color)}>
					{priorityCfg?.label ?? priority}
				</span>
			</DetailField>
		</>
	);
}

export function TagsDetailField({ tags }: { tags: string[] }) {
	if (tags.length === 0) return null;
	return (
		<DetailField label="Tags" className="sm:col-span-2">
			<div className="flex flex-wrap gap-1">
				{tags.map((tag) => (
					<Badge key={tag} variant="outline">
						{tag}
					</Badge>
				))}
			</div>
		</DetailField>
	);
}

export function TextDetailField({
	label,
	value,
	className,
	prose = false,
}: {
	label: string;
	value?: string | null;
	className?: string;
	prose?: boolean;
}) {
	if (!value) return null;
	return (
		<DetailField label={label} className={className}>
			{prose ? (
				<div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap font-sans text-foreground">
					{value}
				</div>
			) : (
				<p className="whitespace-pre-wrap">{value}</p>
			)}
		</DetailField>
	);
}

export function DetailFieldsGrid({ children }: { children: ReactNode }) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm border-t pt-6">
			{children}
		</div>
	);
}

export function StatusPriorityBadges({
	status,
	priority,
	statusConfig,
	priorityConfig,
}: {
	status: string;
	priority: string;
	statusConfig: StatusConfigMap;
	priorityConfig: PriorityConfigMap;
}) {
	const statusCfg = statusConfig[status];
	const priorityCfg = priorityConfig[priority];

	return (
		<>
			<Badge className={cn("text-white text-xs", statusCfg?.color)}>
				{statusCfg?.label}
			</Badge>
			<Badge variant="outline" className="text-xs">
				{priorityCfg?.label}
			</Badge>
		</>
	);
}
