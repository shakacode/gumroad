"use client";

import { EditorContent } from "@tiptap/react";
import * as React from "react";

import { CollapsibleDescription } from "$app/components/Product/CollapsibleDescription";
import { PublicFilesSettingsContext } from "$app/components/ProductEdit/ProductTab/DescriptionEditor";
import { useRichTextEditor } from "$app/components/RichTextEditor";
import { PublicFileEmbed } from "$app/components/TiptapExtensions/PublicFileEmbed";
import { ReviewCard } from "$app/components/TiptapExtensions/ReviewCard";
import { UpsellCard } from "$app/components/TiptapExtensions/UpsellCard";
import { useRunOnce } from "$app/components/useRunOnce";

export type PublicFile = {
  id: string;
  name: string;
  extension: string | null;
  file_size: number | null;
  url: string | null;
};

const ProductDescription = ({
  descriptionHtml,
  initialContent,
  publicFiles,
}: {
  descriptionHtml: string | null;
  initialContent: React.ReactNode;
  publicFiles: PublicFile[];
}) => {
  const [pageLoaded, setPageLoaded] = React.useState(false);
  const descriptionEditor = useRichTextEditor({
    initialValue: pageLoaded ? descriptionHtml : null,
    extensions: [UpsellCard, PublicFileEmbed, ReviewCard],
    editable: false,
  });
  const publicFilesSettings = React.useMemo(() => ({ files: publicFiles }), [publicFiles]);

  useRunOnce(() => setPageLoaded(true));

  return (
    <CollapsibleDescription>
      {/* Mixed-language blocks derive their own direction through _rich_text.scss. */}
      {pageLoaded ? (
        <PublicFilesSettingsContext.Provider value={publicFilesSettings}>
          <EditorContent className="rich-text" dir="auto" editor={descriptionEditor} />
        </PublicFilesSettingsContext.Provider>
      ) : (
        initialContent
      )}
    </CollapsibleDescription>
  );
};

export default ProductDescription;
