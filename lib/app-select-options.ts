import type { AppSelectOption } from "@/components/app-select";

/** Build AppSelect options from a label + className config map. */
export function optionsFromConfig<T extends string>(
	config: Record<T, { label: string; color?: string; className?: string }>,
): AppSelectOption[] {
	return (Object.keys(config) as T[]).map((key) => ({
		value: key,
		label: config[key].label,
		className: config[key].color ?? config[key].className,
	}));
}

/** Plain label/value pairs for default variant selects. */
export function optionsFromLabels<T extends string>(
	entries: Record<T, string> | readonly T[],
	labels?: Record<string, string>,
): AppSelectOption[] {
	if (Array.isArray(entries)) {
		return entries.map((value) => ({
			value,
			label: labels?.[value] ?? value,
		}));
	}
	return (Object.keys(entries) as T[]).map((value) => ({
		value,
		label: labels?.[value] ?? (entries as Record<T, string>)[value],
	}));
}
