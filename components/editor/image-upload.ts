import { createImageUpload } from "novel"
import { toast } from "sonner"

async function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => resolve(reader.result as string)
		reader.onerror = reject
		reader.readAsDataURL(file)
	})
}

export const uploadFn = createImageUpload({
	onUpload: readFileAsDataUrl,
	validateFn: (file) => {
		if (!file.type.includes("image/")) {
			toast.error("Dateityp wird nicht unterstützt.")
			return false
		}
		if (file.size / 1024 / 1024 > 5) {
			toast.error("Datei zu groß (max. 5 MB).")
			return false
		}
		return true
	},
})
