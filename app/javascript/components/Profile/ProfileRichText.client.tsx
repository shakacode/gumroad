"use client";

import { EditorContent } from "@tiptap/react";
import * as React from "react";

import type { RichTextSection } from "$app/components/Profile/Sections";
import { useRichTextEditor } from "$app/components/RichTextEditor";

const ProfileRichText = ({ section }: { section: RichTextSection }) => {
  const editor = useRichTextEditor({ initialValue: section.text, editable: false });
  return <EditorContent editor={editor} className="rich-text -mb-4" />;
};

export default ProfileRichText;
