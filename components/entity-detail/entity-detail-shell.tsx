"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type EntityDetailBreadcrumb = { label: string; href?: string };

type EntityDetailShellProps = {
	breadcrumbs: EntityDetailBreadcrumb[];
	backHref: string;
	title: string;
	badges?: React.ReactNode;
	actions?: React.ReactNode;
	details?: React.ReactNode;
	children?: React.ReactNode;
	contentClassName?: string;
	maxWidthClass?: string;
	childrenClassName?: string;
};

export function EntityDetailShell({
	breadcrumbs,
	backHref,
	title,
	badges,
	actions,
	details,
	children,
	contentClassName,
	maxWidthClass = "max-w-[700px]",
	childrenClassName,
}: EntityDetailShellProps) {
	return (
		<>
			<AppHeader breadcrumbs={breadcrumbs} />

			<div
				className={cn(
					"flex-1 overflow-auto flex flex-col min-h-0",
					contentClassName,
				)}
			>
				<div
					className={cn(
						"p-6 w-full space-y-8 shrink-0",
						maxWidthClass,
					)}
				>
					<div className="flex items-start gap-3">
						<Link href={backHref}>
							<Button variant="ghost" size="icon" className="mt-0.5 shrink-0">
								<ArrowLeft className="size-4" />
							</Button>
						</Link>

						<div className="flex-1 min-w-0 space-y-1.5">
							<h1 className="text-2xl font-bold truncate">{title}</h1>
							{badges ? (
								<div className="flex flex-wrap items-center gap-1.5">
									{badges}
								</div>
							) : null}
						</div>

						{actions ? (
							<div className="flex items-center gap-1 shrink-0">{actions}</div>
						) : null}
					</div>

					{details}
				</div>

				{children ? (
					<div
						className={cn(
							"flex-1 min-h-0 px-6 pb-6 w-full",
							childrenClassName,
						)}
					>
						{children}
					</div>
				) : null}
			</div>
		</>
	);
}
