import { parseISO } from "date-fns";
import * as React from "react";

import { trackUserProductAction } from "$app/data/user_action_event";

import { Modal } from "$app/components/Modal";
import type { RefundPolicy } from "$app/components/Product/ProductRefundPolicy.client";
import { useUserAgentInfo } from "$app/components/UserAgent";

const ProductRefundPolicyModal = ({
  refundPolicy,
  permalink,
  onClose,
}: {
  refundPolicy: RefundPolicy;
  permalink: string;
  onClose: () => void;
}) => {
  const userAgentInfo = useUserAgentInfo();

  React.useEffect(() => {
    void trackUserProductAction({
      name: "product_refund_policy_fine_print_view",
      permalink,
      isModal: true,
    });
  }, []);

  const formattedDate = parseISO(refundPolicy.updated_at).toLocaleString(userAgentInfo.locale, { dateStyle: "medium" });

  return (
    <Modal open onClose={onClose} title={refundPolicy.title} footer={<p>{`Last updated ${formattedDate}`}</p>}>
      <div className="flex flex-col gap-4">
        <div
          dangerouslySetInnerHTML={{
            __html: refundPolicy.fine_print ?? "",
          }}
          style={{ display: "contents" }}
        ></div>
      </div>
    </Modal>
  );
};

export default ProductRefundPolicyModal;
