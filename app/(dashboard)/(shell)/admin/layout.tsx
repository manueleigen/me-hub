import { assertPlatformAdminPage } from "@/lib/platform-admin";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	await assertPlatformAdminPage();

	return (
		<div className="flex flex-1 flex-col min-h-0">
			<AdminNav />
			{children}
		</div>
	);
}
