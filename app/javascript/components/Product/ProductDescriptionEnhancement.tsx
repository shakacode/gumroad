import { EditorContent } from "@tiptap/react";
import * as React from "react";

import type { PublicFile } from "$app/components/Product/ProductDescription.client";
import { PublicFilesSettingsContext } from "$app/components/ProductEdit/ProductTab/DescriptionEditor";
import { useRichTextEditor } from "$app/components/RichTextEditor";
import { PublicFileEmbed } from "$app/components/TiptapExtensions/PublicFileEmbed";
import { ReviewCard } from "$app/components/TiptapExtensions/ReviewCard";
import { UpsellCard } from "$app/components/TiptapExtensions/UpsellCard";

const ProductDescriptionEnhancement = ({
  descriptionHtml,
  initialContent,
  publicFiles,
}: {
  descriptionHtml: string | null;
  initialContent: React.ReactNode;
  publicFiles: PublicFile[];
}) => {
  const descriptionEditor = useRichTextEditor({
    initialValue: descriptionHtml,
    extensions: [UpsellCard, PublicFileEmbed, ReviewCard],
    editable: false,
  });
  const publicFilesSettings = React.useMemo(() => ({ files: publicFiles }), [publicFiles]);
  if (!descriptionEditor) return initialContent;

  return (
    <PublicFilesSettingsContext.Provider value={publicFilesSettings}>
      <EditorContent className="rich-text" dir="auto" editor={descriptionEditor} />
    </PublicFilesSettingsContext.Provider>
  );
};

export default ProductDescriptionEnhancement;
