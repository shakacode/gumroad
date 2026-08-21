"use client";

import { parseISO } from "date-fns";
import * as React from "react";

import { trackUserProductAction } from "$app/data/user_action_event";

import { Modal } from "$app/components/Modal";
import type { RefundPolicy } from "$app/components/Product/Interactive";
import { useUserAgentInfo } from "$app/components/UserAgent";
import { useRunOnce } from "$app/components/useRunOnce";

export const ProductRefundPolicy = ({ refundPolicy, permalink }: { refundPolicy: RefundPolicy; permalink: string }) => {
  const HASH = "#refund-policy";
  const [viewingRefundPolicy, setViewingRefundPolicy] = React.useState(false);
  const userAgentInfo = useUserAgentInfo();

  useRunOnce(() => {
    setViewingRefundPolicy(window.location.hash === HASH);
  });

  React.useEffect(() => {
    if (viewingRefundPolicy) {
      void trackUserProductAction({
        name: "product_refund_policy_fine_print_view",
        permalink,
        isModal: true,
      });
    }
  }, [viewingRefundPolicy]);

  const formattedDate = parseISO(refundPolicy.updated_at).toLocaleString(userAgentInfo.locale, { dateStyle: "medium" });
  const lastUpdated = `Last updated ${formattedDate}`;

  const handleCloseModal = () => {
    setViewingRefundPolicy(false);
    window.history.replaceState(window.history.state, "", window.location.href.split("#")[0]);
  };

  return (
    <>
      <div className="text-center">
        {refundPolicy.fine_print ? (
          <a href={HASH} onClick={() => setViewingRefundPolicy(true)}>
            {refundPolicy.title}
          </a>
        ) : (
          refundPolicy.title
        )}
      </div>
      {refundPolicy.fine_print ? (
        <Modal
          open={viewingRefundPolicy}
          onClose={handleCloseModal}
          title={refundPolicy.title}
          footer={<p>{lastUpdated}</p>}
        >
          <div className="flex flex-col gap-4">
            <div
              dangerouslySetInnerHTML={{
                __html: refundPolicy.fine_print,
              }}
              style={{ display: "contents" }}
            ></div>
          </div>
        </Modal>
      ) : null}
    </>
  );
};
