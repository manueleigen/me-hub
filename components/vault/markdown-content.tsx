"use client"

import * as React from "react"

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  // Remove frontmatter from content for display
  const displayContent = React.useMemo(() => {
    const frontmatterRegex = /^---\n[\s\S]*?\n---\n/
    return content.replace(frontmatterRegex, "").trim()
  }, [content])

  // Simple markdown to HTML conversion for basic formatting
  const htmlContent = React.useMemo(() => {
    let html = displayContent
      // Headers
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-6 mb-2">$1</h3>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-8 mb-3">$1</h2>')
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-8 mb-4">$1</h1>')
      // Bold and italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg overflow-x-auto my-4"><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code class="bg-muted px-1.5 py-0.5 rounded text-sm">$1</code>')
      // Checkboxes
      .replace(/- \[x\] (.*$)/gm, '<div class="flex items-center gap-2 my-1"><span class="size-4 rounded border bg-primary flex items-center justify-center"><svg class="size-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg></span><span class="line-through text-muted-foreground">$1</span></div>')
      .replace(/- \[ \] (.*$)/gm, '<div class="flex items-center gap-2 my-1"><span class="size-4 rounded border bg-background"></span><span>$1</span></div>')
      // Lists
      .replace(/^- (.*$)/gm, '<li class="ml-4 my-1">$1</li>')
      // Links
      .replace(/\[\[(.*?)\]\]/g, '<a href="#" class="text-primary hover:underline">$1</a>')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
      // Tables
      .replace(/\|(.+)\|/g, (match) => {
        const cells = match.split('|').filter(Boolean)
        const row = cells.map(cell => `<td class="border px-3 py-2">${cell.trim()}</td>`).join('')
        return `<tr>${row}</tr>`
      })
      // Horizontal rule
      .replace(/^---$/gm, '<hr class="my-6 border-border" />')
      // Paragraphs (wrap remaining text)
      .split('\n\n')
      .map(para => {
        if (para.startsWith('<')) return para
        if (para.trim() === '') return ''
        return `<p class="my-3 leading-relaxed">${para}</p>`
      })
      .join('\n')

    // Wrap consecutive list items in ul
    html = html.replace(/(<li.*?<\/li>\n?)+/g, '<ul class="list-disc list-inside my-3">$&</ul>')
    // Wrap table rows in table
    html = html.replace(/(<tr>.*?<\/tr>\n?)+/g, '<table class="w-full border-collapse my-4">$&</table>')

    return html
  }, [displayContent])

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
