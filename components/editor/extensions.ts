import {
	TiptapLink,
	TiptapUnderline,
	UpdatedImage,
	TaskList,
	TaskItem,
	HorizontalRule,
	StarterKit,
	Placeholder,
	UploadImagesPlugin,
} from "novel"
import { Markdown } from "tiptap-markdown"
import { cx } from "class-variance-authority"

const placeholder = Placeholder.configure({
	placeholder: ({ node }) => {
		if (node.type.name === "heading") {
			return `Überschrift ${node.attrs.level}`
		}
		return "Tippe '/' für Befehle…"
	},
	includeChildren: true,
})

const tiptapLink = TiptapLink.configure({
	HTMLAttributes: {
		class: cx(
			"text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer",
		),
	},
	validate: (url) =>
		/^https?:\/\//i.test(url) ||
		url.startsWith("/") ||
		url.startsWith("#") ||
		url.startsWith("mailto:"),
})

const tiptapImage = UpdatedImage.extend({
	addProseMirrorPlugins() {
		return [
			UploadImagesPlugin({
				imageClass: cx("opacity-40 rounded-lg border border-border"),
			}),
		]
	},
}).configure({
	allowBase64: false,
	HTMLAttributes: {
		class: cx("rounded-lg border border-border"),
	},
})

const taskList = TaskList.configure({
	HTMLAttributes: {
		class: cx("not-prose pl-2"),
	},
})

const taskItem = TaskItem.configure({
	HTMLAttributes: {
		class: cx("flex items-start my-4 gap-2"),
	},
	nested: true,
})

const horizontalRule = HorizontalRule.configure({
	HTMLAttributes: {
		class: cx("mt-4 mb-6 border-t border-border"),
	},
})

const starterKit = StarterKit.configure({
	bulletList: {
		HTMLAttributes: {
			class: cx("list-disc list-outside leading-3 ml-4"),
		},
	},
	orderedList: {
		HTMLAttributes: {
			class: cx("list-decimal list-outside leading-3 ml-4"),
		},
	},
	listItem: {
		HTMLAttributes: {
			class: cx("leading-normal my-2"),
		},
	},
	blockquote: {
		HTMLAttributes: {
			class: cx("border-l-4 border-primary pl-4 my-4"),
		},
	},
	codeBlock: {
		HTMLAttributes: {
			class: cx(
				"rounded-lg border border-border bg-muted p-4 font-mono text-sm",
			),
		},
	},
	code: {
		HTMLAttributes: {
			class: cx("rounded bg-muted px-1.5 py-0.5 font-mono text-sm"),
			spellcheck: "false",
		},
	},
	horizontalRule: false,
	dropcursor: {
		color: "hsl(var(--primary))",
		width: 4,
	},
	gapcursor: false,
})

const markdown = Markdown.configure({
	html: false,
	tightLists: true,
	tightListClass: "tight",
	bulletListMarker: "-",
	linkify: false,
	breaks: false,
	transformPastedText: true,
	transformCopiedText: false,
})

export const defaultExtensions = [
	starterKit,
	placeholder,
	tiptapLink,
	tiptapImage,
	taskList,
	taskItem,
	horizontalRule,
	TiptapUnderline,
	markdown,
]
