import React from "react";

import { useLoggedInUser } from "$app/components/LoggedInUser";

type LazyLoadingProps = {
  eager?: boolean | undefined;
};

const useLazyLoadingProps = (
  options: LazyLoadingProps = { eager: false },
): {
  fetchPriority?: "auto" | "high";
  loading?: "eager" | "lazy";
} => {
  const { eager } = options;
  const loggedInUser = useLoggedInUser();

  const lazyLoadingEnabled = loggedInUser == null || loggedInUser.lazyLoadOffscreenDiscoverImages;

  return React.useMemo(() => {
    if (eager == null || !lazyLoadingEnabled) {
      return {};
    }

    if (eager) {
      return { fetchPriority: "high" as const, loading: "eager" as const };
    }

    return { fetchPriority: "auto" as const, loading: "lazy" as const };
  }, [eager, lazyLoadingEnabled]);
};

export default useLazyLoadingProps;
