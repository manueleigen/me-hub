"use client";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type AppSelectVariant = "default" | "colored" | "pill";

export type AppSelectOption = {
	value: string;
	label: string;
	/** Tailwind classes — text color for `colored`, background for `pill`. */
	className?: string;
};

export type AppSelectProps = {
	variant?: AppSelectVariant;
	value: string;
	onValueChange: (value: string) => void;
	options: AppSelectOption[];
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	triggerClassName?: string;
	size?: "sm" | "default";
};

function OptionLabel({
	variant,
	option,
}: {
	variant: AppSelectVariant;
	option: AppSelectOption;
}) {
	if (variant === "pill") {
		const hasTextColor = option.className?.includes("text-");
		return (
			<span
				className={cn(
					"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
					!hasTextColor && "text-white",
					option.className,
				)}
			>
				{option.label}
			</span>
		);
	}

	if (variant === "colored") {
		return (
			<span className={cn("text-sm font-medium", option.className)}>
				{option.label}
			</span>
		);
	}

	return <span className="text-sm">{option.label}</span>;
}

export function AppSelect({
	variant = "default",
	value,
	onValueChange,
	options,
	placeholder = "Auswählen…",
	disabled,
	className,
	triggerClassName,
	size = "default",
}: AppSelectProps) {
	const selected = options.find((o) => o.value === value);

	return (
		<Select value={value} onValueChange={onValueChange} disabled={disabled}>
			<SelectTrigger
				size={size}
				className={cn("w-full", triggerClassName, className)}
			>
				<SelectValue placeholder={placeholder}>
					{selected ? (
						<OptionLabel variant={variant} option={selected} />
					) : (
						<span className="text-muted-foreground">{placeholder}</span>
					)}
				</SelectValue>
			</SelectTrigger>
			<SelectContent>
				{options.map((option) => (
					<SelectItem
						key={option.value}
						value={option.value}
						className={cn(variant === "pill" && "py-1.5")}
					>
						<OptionLabel variant={variant} option={option} />
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
