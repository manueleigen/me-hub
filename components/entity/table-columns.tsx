import { Badge } from "@/components/ui/badge";
import type { ColumnConfig } from "@/components/sortable-table";
import type {
	PriorityConfigMap,
	StatusConfigMap,
} from "@/lib/entity/types";
import { cn } from "@/lib/utils";

type TitledEntity = {
	title: string;
	description?: string;
	status: string;
	priority: string;
};

export function buildTitleColumn<T extends TitledEntity>(): ColumnConfig<T> {
	return {
		key: "title",
		label: "Titel",
		sortable: true,
		filterType: "text",
		getValue: (item) => item.title,
		render: (item) => (
			<div>
				<div className="font-medium">{item.title}</div>
				{item.description && (
					<div className="text-sm text-muted-foreground line-clamp-1">
						{item.description}
					</div>
				)}
			</div>
		),
	};
}

export function buildStatusColumn<T extends TitledEntity>(
	statusConfig: StatusConfigMap,
	statusKeys: string[],
): ColumnConfig<T> {
	return {
		key: "status",
		label: "Status",
		sortable: true,
		filterType: "select",
		filterOptions: statusKeys.map((s) => ({
			value: s,
			label: statusConfig[s]?.label ?? s,
		})),
		getValue: (item) => item.status,
		render: (item) => (
			<Badge className={cn("text-white", statusConfig[item.status]?.color)}>
				{statusConfig[item.status]?.label}
			</Badge>
		),
	};
}

export function buildPriorityColumn<T extends TitledEntity>(
	priorityConfig: PriorityConfigMap,
	priorityKeys: string[],
): ColumnConfig<T> {
	return {
		key: "priority",
		label: "Priorität",
		sortable: true,
		filterType: "select",
		filterOptions: priorityKeys.map((p) => ({
			value: p,
			label: priorityConfig[p]?.label ?? p,
		})),
		getValue: (item) => item.priority,
		render: (item) => (
			<span className={cn("font-medium", priorityConfig[item.priority]?.color)}>
				{priorityConfig[item.priority]?.label}
			</span>
		),
	};
}
