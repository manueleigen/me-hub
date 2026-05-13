"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { getUserSettings, updateUserSettings } from "@/app/actions/settings";

interface Settings {
	darkMode: boolean;
	githubSync: boolean;
	autoSave: boolean;
	vaultGithubOwner: string;
	vaultGithubRepo: string;
	vaultGithubBranch: string;
}

interface SettingsContextType {
	settings: Settings;
	updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
	isLoading: boolean;
}

const defaultSettings: Settings = {
	darkMode: true,
	githubSync: false,
	autoSave: true,
	vaultGithubOwner: "",
	vaultGithubRepo: "",
	vaultGithubBranch: "",
};

const SettingsContext = React.createContext<SettingsContextType>({
	settings: defaultSettings,
	updateSetting: async () => {},
	isLoading: true,
});

export function SettingsProvider({ children }: { children: React.ReactNode }) {
	const [settings, setSettings] = React.useState<Settings>(defaultSettings);
	const [isLoading, setIsLoading] = React.useState(true);
	const { setTheme } = useTheme();

	React.useEffect(() => {
		getUserSettings().then((s) => {
			if (s) {
				setSettings({
					darkMode: s.darkMode,
					githubSync: s.githubSync,
					autoSave: s.autoSave,
					vaultGithubOwner: s.vaultGithubOwner ?? "",
					vaultGithubRepo: s.vaultGithubRepo ?? "",
					vaultGithubBranch: s.vaultGithubBranch ?? "",
				});
				setTheme(s.darkMode ? "dark" : "light");
			}
			setIsLoading(false);
		});
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

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
