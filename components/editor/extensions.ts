import {
  TiptapImage,
  TiptapLink,
  UpdatedImage,
  TaskList,
  TaskItem,
  HorizontalRule,
  StarterKit,
  Placeholder,
  AIHighlight,
} from "novel"
import { cx } from "class-variance-authority"

const aiHighlight = AIHighlight
const placeholder = Placeholder
const tiptapLink = TiptapLink.configure({
  HTMLAttributes: {
    class: cx(
      "text-primary underline underline-offset-[3px] hover:text-primary/80 transition-colors cursor-pointer"
    ),
  },
})

const tiptapImage = TiptapImage.extend({
  addProseMirrorPlugins() {
    return [
      UploadImagesPlugin({
        imageClass: cx("opacity-40 rounded-lg border border-border"),
      }),
    ]
  },
}).configure({
  allowBase64: true,
  HTMLAttributes: {
    class: cx("rounded-lg border border-border"),
  },
})

const updatedImage = UpdatedImage.configure({
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
        "rounded-lg border border-border bg-muted p-4 font-mono text-sm"
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

// Simple upload placeholder plugin
function UploadImagesPlugin(options: { imageClass: string }) {
  return {
    name: "uploadImagesPlugin",
  }
}

export const defaultExtensions = [
  starterKit,
  placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`
      }
      return "Tippe '/' fuer Befehle..."
    },
    includeChildren: true,
  }),
  tiptapLink,
  tiptapImage,
  updatedImage,
  taskList,
  taskItem,
  horizontalRule,
  aiHighlight,
]
