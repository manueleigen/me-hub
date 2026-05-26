"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type DetailDrawerTitleProps = {
	id?: string;
	value: string;
	onChange: (value: string) => void;
	disabled?: boolean;
	placeholder?: string;
	className?: string;
};

export function DetailDrawerTitle({
	id,
	value,
	onChange,
	disabled,
	placeholder,
	className,
}: DetailDrawerTitleProps) {
	return (
		<Input
			id={id}
			value={value}
			onChange={(e) => onChange(e.target.value)}
			disabled={disabled}
			placeholder={placeholder}
			className={cn(
				"h-auto min-h-0 w-full border-0 bg-transparent px-0 py-0 p-2 text-2xl leading-snug font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-2xl",
				className,
			)}
		/>
	);
}
