"use client";

import { EditorContent } from "@tiptap/react";
import * as React from "react";

import type { RichTextSection } from "$app/components/Profile/Sections";
import { useRichTextEditor } from "$app/components/RichTextEditor";

const ProfileRichText = ({ section, fallback }: { section: RichTextSection; fallback: React.ReactNode }) => {
  const editor = useRichTextEditor({ initialValue: section.text, editable: false });
  return editor ? <EditorContent editor={editor} className="rich-text -mb-4" /> : fallback;
};

export default ProfileRichText;
