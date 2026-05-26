"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import {
	Drawer,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DetailDrawerProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	srTitle: string;
	header: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	onClose?: () => void;
	className?: string;
};

export function DetailDrawer({
	open,
	onOpenChange,
	srTitle,
	header,
	children,
	footer,
	onClose,
	className,
}: DetailDrawerProps) {
	return (
		<Drawer open={open} onOpenChange={onOpenChange} direction="right">
			<DrawerContent
				className={cn(
					"h-full max-h-none w-full sm:max-w-xl md:max-w-2xl data-[vaul-drawer-direction=right]:mt-0 data-[vaul-drawer-direction=right]:rounded-none",
					className,
				)}
			>
				<DrawerTitle className="sr-only">{srTitle}</DrawerTitle>
				<DrawerHeader className="border-b pb-4">
					<div className="flex items-start justify-between gap-3">
						<div className="min-w-0 flex-1">{header}</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							className="shrink-0"
							onClick={onClose}
						>
							<X className="size-4" />
							<span className="sr-only">Schließen</span>
						</Button>
					</div>
				</DrawerHeader>

				<div className="flex-1 overflow-y-auto px-4 py-4 [&_[data-slot=select-trigger]]:w-full">
					{children}
				</div>

				{footer ? (
					<DrawerFooter className="border-t flex-row justify-between gap-2">
						{footer}
					</DrawerFooter>
				) : null}
			</DrawerContent>
		</Drawer>
	);
}
