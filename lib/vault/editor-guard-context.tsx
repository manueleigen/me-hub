"use client";

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

export type VaultEditorSavePhase = "idle" | "saving-file" | "save-complete";

export type VaultEditorSaveOptions = {
	/** Persist without touching editor UI (editor may already be unmounted). */
	background?: boolean;
	showToast?: boolean;
};

export type VaultEditorRegistration = {
	isDirty: () => boolean;
	/** Snapshot current editor content synchronously — call before navigation. */
	captureContent: () => string | null;
	saveContent: (
		content: string,
		options?: VaultEditorSaveOptions,
	) => Promise<boolean>;
};

type VaultEditorGuardContextValue = {
	savePhase: VaultEditorSavePhase;
	registerEditor: (editor: VaultEditorRegistration | null) => void;
	/** Navigate immediately; save dirty editor content in the background. */
	navigateWithSave: (href: string) => void;
};

const VaultEditorGuardContext = createContext<VaultEditorGuardContextValue | null>(
	null,
);

function isModifiedClick(event: MouseEvent): boolean {
	return (
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey ||
		event.button !== 0
	);
}

function shouldInterceptNavigation(href: string, pathname: string): boolean {
	try {
		const url = new URL(href, window.location.origin);
		if (url.origin !== window.location.origin) return false;
		return url.pathname !== pathname || url.search !== "";
	} catch {
		return false;
	}
}

export function VaultEditorGuardProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();
	const editorRef = useRef<VaultEditorRegistration | null>(null);
	const [savePhase, setSavePhase] = useState<VaultEditorSavePhase>("idle");

	const registerEditor = useCallback((editor: VaultEditorRegistration | null) => {
		editorRef.current = editor;
	}, []);

	const scheduleIdlePhase = useCallback(() => {
		window.setTimeout(() => setSavePhase("idle"), 1200);
	}, []);

	const navigateWithSave = useCallback(
		(href: string) => {
			const editor = editorRef.current;
			let pendingSave: Promise<boolean> | null = null;

			if (editor?.isDirty()) {
				const content = editor.captureContent();
				if (content !== null) {
					setSavePhase("saving-file");
					// Start save before navigation — editor unmounts on route change.
					pendingSave = editor.saveContent(content, {
						background: true,
					});
				}
			}

			router.push(href);

			if (pendingSave) {
				void pendingSave
					.then((ok) => {
						if (ok) {
							setSavePhase("save-complete");
							scheduleIdlePhase();
						} else {
							setSavePhase("idle");
						}
					})
					.catch(() => {
						setSavePhase("idle");
						toast.error("Speichern fehlgeschlagen – bitte erneut versuchen");
					});
			}
		},
		[router, scheduleIdlePhase],
	);

	useEffect(() => {
		const onClick = (event: MouseEvent) => {
			if (isModifiedClick(event)) return;

			const editor = editorRef.current;
			if (!editor?.isDirty()) return;

			const anchor = (event.target as HTMLElement).closest("a[href]");
			if (!anchor) return;
			if (anchor.getAttribute("target") === "_blank") return;

			const href = anchor.getAttribute("href");
			if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
			if (!shouldInterceptNavigation(href, pathname)) return;

			event.preventDefault();
			event.stopPropagation();
			navigateWithSave(href);
		};

		document.addEventListener("click", onClick, true);
		return () => document.removeEventListener("click", onClick, true);
	}, [pathname, navigateWithSave]);

	return (
		<VaultEditorGuardContext.Provider
			value={{
				savePhase,
				registerEditor,
				navigateWithSave,
			}}
		>
			{children}
		</VaultEditorGuardContext.Provider>
	);
}

export function useVaultEditorGuard(): VaultEditorGuardContextValue {
	const ctx = useContext(VaultEditorGuardContext);
	if (!ctx) {
		return {
			savePhase: "idle",
			registerEditor: () => {},
			navigateWithSave: () => {},
		};
	}
	return ctx;
}
