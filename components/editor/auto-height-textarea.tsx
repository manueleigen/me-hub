"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutoHeightTextareaProps
	extends Omit<
		React.TextareaHTMLAttributes<HTMLTextAreaElement>,
		"value" | "onChange"
	> {
	value: string;
	onValueChange: (value: string) => void;
	onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
}

export function AutoHeightTextarea({
	value,
	onValueChange,
	className,
	onKeyDown,
	onChange,
	...props
}: AutoHeightTextareaProps) {
	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const mirrorRef = React.useRef<HTMLTextAreaElement>(null);
	const scrollLockRef = React.useRef<number | null>(null);

	const getScrollViewport = React.useCallback(
		(textarea: HTMLTextAreaElement) =>
			textarea.closest<HTMLElement>('[data-slot="scroll-area-viewport"]'),
		[],
	);

	const captureScroll = React.useCallback(
		(textarea: HTMLTextAreaElement) => {
			const scrollEl = getScrollViewport(textarea);
			if (scrollEl) scrollLockRef.current = scrollEl.scrollTop;
		},
		[getScrollViewport],
	);

	const restoreScroll = React.useCallback(() => {
		const textarea = textareaRef.current;
		if (!textarea || scrollLockRef.current === null) return;
		const scrollEl = getScrollViewport(textarea);
		if (scrollEl) scrollEl.scrollTop = scrollLockRef.current;
	}, [getScrollViewport]);

	const syncHeight = React.useCallback(() => {
		const textarea = textareaRef.current;
		const mirror = mirrorRef.current;
		if (!textarea || !mirror) return;
		textarea.style.height = `${mirror.scrollHeight}px`;
	}, []);

	React.useLayoutEffect(() => {
		syncHeight();
		restoreScroll();
	}, [value, syncHeight, restoreScroll]);

	React.useEffect(() => {
		restoreScroll();
		const frame = requestAnimationFrame(() => {
			restoreScroll();
			requestAnimationFrame(restoreScroll);
		});
		return () => cancelAnimationFrame(frame);
	}, [value, restoreScroll]);

	return (
		<div className="relative [overflow-anchor:none]">
			<textarea
				ref={textareaRef}
				value={value}
				{...props}
				className={cn(
					"block w-full min-h-[12rem] overflow-hidden resize-none",
					className,
				)}
				onKeyDown={(event) => {
					captureScroll(event.currentTarget);
					onKeyDown?.(event);
					requestAnimationFrame(() => {
						restoreScroll();
						requestAnimationFrame(restoreScroll);
					});
				}}
				onBeforeInput={(event) => captureScroll(event.currentTarget)}
				onPaste={(event) => captureScroll(event.currentTarget)}
				onChange={(event) => {
					onValueChange(event.target.value);
					onChange?.(event);
				}}
			/>
			<textarea
				ref={mirrorRef}
				aria-hidden
				tabIndex={-1}
				readOnly
				value={value}
				rows={1}
				className={cn(
					"pointer-events-none absolute inset-x-0 top-0 -z-10 block w-full min-h-[12rem] overflow-hidden opacity-0 resize-none",
					className,
				)}
			/>
		</div>
	);
}
