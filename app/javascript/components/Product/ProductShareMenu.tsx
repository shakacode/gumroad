import { Link } from "@boxicons/react";
import * as React from "react";

import { Button } from "$app/components/Button";
import { CopyToClipboard } from "$app/components/CopyToClipboard";
import { FacebookShareButton } from "$app/components/FacebookShareButton";
import { TwitterShareButton } from "$app/components/TwitterShareButton";

const ProductShareMenu = ({ url, name }: { url: string; name: string }) => (
  <div className="grid grid-cols-1 gap-4">
    <TwitterShareButton url={url} text={`Buy ${name} on @Gumroad`} />
    <FacebookShareButton url={url} text={name} />
    <CopyToClipboard text={url} copyTooltip="Copy product URL">
      <Button aria-label="Copy product URL">
        <Link className="size-5" /> Copy link
      </Button>
    </CopyToClipboard>
  </div>
);

export default ProductShareMenu;
