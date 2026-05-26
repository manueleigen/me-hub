import { Command, createSuggestionItems, renderItems } from "novel"
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  List,
  ListOrdered,
  Text,
  TextQuote,
  Minus,
} from "lucide-react"
import { uploadFn } from "./image-upload"

export const suggestionItems = createSuggestionItems([
  {
    title: "Text",
    description: "Normaler Fliesstext.",
    searchTerms: ["p", "paragraph"],
    icon: <Text className="size-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .run()
    },
  },
  {
    title: "Ueberschrift 1",
    description: "Grosse Ueberschrift.",
    searchTerms: ["title", "big", "large", "h1"],
    icon: <Heading1 className="size-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 1 })
        .run()
    },
  },
  {
    title: "Ueberschrift 2",
    description: "Mittlere Ueberschrift.",
    searchTerms: ["subtitle", "medium", "h2"],
    icon: <Heading2 className="size-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 2 })
        .run()
    },
  },
  {
    title: "Ueberschrift 3",
    description: "Kleine Ueberschrift.",
    searchTerms: ["small", "h3"],
    icon: <Heading3 className="size-4" />,
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .setNode("heading", { level: 3 })
        .run()
    },
  },
  {
    title: "Aufzaehlung",
    description: "Ungeordnete Liste.",
    searchTerms: ["unordered", "point", "bullet"],
    icon: <List className="size-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: "Nummerierte Liste",
    description: "Geordnete Liste.",
    searchTerms: ["ordered", "number"],
    icon: <ListOrdered className="size-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: "Aufgabenliste",
    description: "Liste mit Checkboxen.",
    searchTerms: ["todo", "task", "checkbox"],
    icon: <CheckSquare className="size-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run()
    },
  },
  {
    title: "Zitat",
    description: "Zitat-Block.",
    searchTerms: ["blockquote", "quote"],
    icon: <TextQuote className="size-4" />,
    command: ({ editor, range }) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .toggleNode("paragraph", "paragraph")
        .toggleBlockquote()
        .run(),
  },
  {
    title: "Code",
    description: "Code-Block.",
    searchTerms: ["codeblock", "code"],
    icon: <Code className="size-4" />,
    command: ({ editor, range }) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Trennlinie",
    description: "Horizontale Linie.",
    searchTerms: ["hr", "divider", "separator"],
    icon: <Minus className="size-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run()
    },
  },
  {
    title: "Bild",
    description: "Bild hochladen oder per URL einfügen.",
    searchTerms: ["photo", "picture", "media", "image"],
    icon: <ImageIcon className="size-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run()
      const input = document.createElement("input")
      input.type = "file"
      input.accept = "image/*"
      input.onchange = async () => {
        if (input.files?.length) {
          const file = input.files[0]
          const pos = editor.view.state.selection.from
          uploadFn(file, editor.view, pos)
        }
      }
      input.click()
    },
  },
])

export const slashCommand = Command.configure({
  suggestion: {
    items: () => suggestionItems,
    render: renderItems,
  },
})
