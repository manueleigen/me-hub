"use client";

import * as React from "react";
import { format, parseISO, isValid } from "date-fns";
import { de } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export interface DatePickerProps {
	/** ISO date string `YYYY-MM-DD` */
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
}

function parseIsoDate(value?: string): Date | undefined {
	if (!value?.trim()) return undefined;
	const parsed = parseISO(value);
	return isValid(parsed) ? parsed : undefined;
}

export function DatePicker({
	value,
	onChange,
	placeholder = "Datum wählen",
	disabled,
	className,
}: DatePickerProps) {
	const [open, setOpen] = React.useState(false);
	const selected = parseIsoDate(value);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					data-empty={!selected}
					className={cn(
						"w-full justify-start text-left font-normal data-[empty=true]:text-muted-foreground",
						className,
					)}
				>
					<CalendarIcon className="size-4 shrink-0 opacity-70" />
					{selected ? (
						format(selected, "PPP", { locale: de })
					) : (
						<span>{placeholder}</span>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-auto p-0" align="start">
				<Calendar
					mode="single"
					locale={de}
					selected={selected}
					onSelect={(date) => {
						onChange(date ? format(date, "yyyy-MM-dd") : "");
						setOpen(false);
					}}
					initialFocus
				/>
			</PopoverContent>
		</Popover>
	);
}
