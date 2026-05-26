"use client";

import { useState, useRef, type KeyboardEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { coerceStringArray } from "@/lib/frontmatter";
import { X } from "lucide-react";

interface TagInputProps {
  values: string[];
  onChange: (values: string[]) => void;
}

export function TagInput({ values, onChange }: TagInputProps) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const items = coerceStringArray(values);

  const add = () => {
    const trimmed = inputVal.trim();
    if (trimmed && !items.includes(trimmed)) onChange([...items, trimmed]);
    setInputVal("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  };

  return (
    <div
      className="flex flex-wrap gap-1.5 min-h-9 rounded-md border bg-background px-3 py-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {items.map((v) => (
        <Badge key={v} variant="secondary" className="gap-1 pr-1">
          {v}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(items.filter((x) => x !== v));
            }}
            className="hover:text-destructive"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={add}
        placeholder="Tag + Enter"
        className="flex-1 min-w-20 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
