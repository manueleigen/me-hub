"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { updateUserSettings } from "@/app/actions/settings";
import type { VaultUserSettings } from "@/lib/cache/server";

interface Settings {
	darkMode: boolean;
	autoSave: boolean;
}

interface SettingsContextType {
	settings: Settings;
	updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
	isLoading: boolean;
}

const defaultSettings: Settings = {
	darkMode: true,
	autoSave: true,
};

const SettingsContext = React.createContext<SettingsContextType>({
	settings: defaultSettings,
	updateSetting: async () => {},
	isLoading: true,
});

function toSettings(s: VaultUserSettings): Settings {
	return {
		darkMode: s.darkMode,
		autoSave: s.autoSave,
	};
}

export function SettingsProvider({
	children,
	initialSettings = null,
}: {
	children: React.ReactNode;
	initialSettings?: VaultUserSettings | null;
}) {
	const [settings, setSettings] = React.useState<Settings>(
		initialSettings ? toSettings(initialSettings) : defaultSettings,
	);
	const [isLoading, setIsLoading] = React.useState(!initialSettings);
	const { setTheme } = useTheme();

	React.useEffect(() => {
		if (initialSettings) {
			setTheme(initialSettings.darkMode ? "dark" : "light");
			setIsLoading(false);
		}
	}, [initialSettings, setTheme]);

	const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
		const next = { ...settings, [key]: value };
		setSettings(next);
		await updateUserSettings({ [key]: value } as Parameters<typeof updateUserSettings>[0]);
		if (key === "darkMode") {
			setTheme(value ? "dark" : "light");
		}
	};

	return (
		<SettingsContext.Provider value={{ settings, updateSetting, isLoading }}>
			{children}
		</SettingsContext.Provider>
	);
}

export function useSettings() {
	return React.useContext(SettingsContext);
}
