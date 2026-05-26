"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
	PriorityConfigMap,
	StatusConfigMap,
} from "@/lib/entity/types";
import { cn } from "@/lib/utils";

type GroupedEntityTabProps<T> = {
	groups: Record<string, T[]>;
	emptyGroupLabel: string;
	groupIcon: ReactNode;
	statusConfig: StatusConfigMap;
	priorityConfig: PriorityConfigMap;
	getItemKey: (item: T) => string;
	getTitle: (item: T) => string;
	getStatus: (item: T) => string;
	getPriority: (item: T) => string;
	renderTrailing?: (item: T) => ReactNode;
	onOpen: (item: T) => void;
};

export function GroupedEntityTab<T>({
	groups,
	emptyGroupLabel,
	groupIcon,
	statusConfig,
	priorityConfig,
	getItemKey,
	getTitle,
	getStatus,
	getPriority,
	renderTrailing,
	onOpen,
}: GroupedEntityTabProps<T>) {
	return (
		<div className="space-y-4">
			{Object.entries(groups)
				.sort(([a], [b]) => {
					if (a === emptyGroupLabel) return 1;
					if (b === emptyGroupLabel) return -1;
					return a.localeCompare(b);
				})
				.map(([groupName, groupItems]) => (
					<Card key={groupName}>
						<CardHeader className="pb-3">
							<div className="flex items-center gap-2">
								{groupIcon}
								<CardTitle className="text-base">{groupName}</CardTitle>
								<Badge variant="secondary" className="ml-auto">
									{groupItems.length}
								</Badge>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="space-y-1">
								{groupItems.map((item) => (
									<div
										key={getItemKey(item)}
										className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50 cursor-pointer"
										onClick={() => onOpen(item)}
									>
										<div
											className={cn(
												"size-2 rounded-full shrink-0",
												statusConfig[getStatus(item)]?.color,
											)}
										/>
										<div className="flex-1 min-w-0">
											<span className="font-medium text-sm truncate block">
												{getTitle(item)}
											</span>
										</div>
										<span
											className={cn(
												"text-xs font-medium shrink-0",
												priorityConfig[getPriority(item)]?.color,
											)}
										>
											{priorityConfig[getPriority(item)]?.label}
										</span>
										{renderTrailing?.(item)}
										<Badge
											className={cn(
												"text-white text-xs shrink-0",
												statusConfig[getStatus(item)]?.color,
											)}
										>
											{statusConfig[getStatus(item)]?.label}
										</Badge>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				))}
		</div>
	);
}
