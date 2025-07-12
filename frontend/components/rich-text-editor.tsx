"use client";

import dynamic from "next/dynamic";
import * as React from "react";
import "react-quill/dist/quill.snow.css";
import { cn } from "@/lib/utils";

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const toolbarOptions = [
  [{ header: [1, 2, 3, false] }],
  ["bold", "italic", "strike"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image"],
  [{ align: [] }],
  ["emoji"],
  ["clean"],
];

const formats = [
  "header",
  "bold",
  "italic",
  "strike",
  "list",
  "bullet",
  "link",
  "image",
  "align",
  "emoji",
  "clean",
];

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
}: RichTextEditorProps) {
  return (
    <div className={cn("relative", className)}>
      <ReactQuill
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={{
          toolbar: toolbarOptions,
        }}
        formats={formats}
        className="min-h-[200px]"
        theme="snow"
      />
    </div>
  );
}
