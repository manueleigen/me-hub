"use client";

import * as React from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Dropdown menu anchored at pointer position (right-click). */
export function VaultPointerMenu({
	open,
	x,
	y,
	onOpenChange,
	children,
}: {
	open: boolean;
	x: number;
	y: number;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}) {
	return (
		<DropdownMenu open={open} onOpenChange={onOpenChange} modal>
			<DropdownMenuTrigger asChild>
				<span
					aria-hidden
					className="pointer-events-none fixed z-[200] size-px"
					style={{ left: x, top: y }}
				/>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-44"
				align="start"
				side="right"
				sideOffset={4}
				onCloseAutoFocus={(e) => e.preventDefault()}
			>
				{children}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
