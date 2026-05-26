import { cn } from "@/lib/utils";

export function DetailField({
	label,
	children,
	className,
}: {
	label: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn("space-y-1", className)}>
			<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
				{label}
			</p>
			<div className="text-sm">{children}</div>
		</div>
	);
}
