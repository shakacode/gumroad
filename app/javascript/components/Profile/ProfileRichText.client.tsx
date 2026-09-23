"use client";

import { EditorContent } from "@tiptap/react";
import * as React from "react";

import { useRichTextEditor } from "$app/components/RichTextEditor";

const ProfileRichText = ({ content, fallback }: { content: Record<string, unknown>; fallback: React.ReactNode }) => {
  const editor = useRichTextEditor({ initialValue: content, editable: false });
  return editor ? <EditorContent editor={editor} className="rich-text -mb-4" /> : fallback;
};

export default ProfileRichText;
