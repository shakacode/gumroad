import classNames from "classnames";
import * as React from "react";

export const ProfileSectionLayout = ({
  children,
  className,
  ...props
}: { children: React.ReactNode } & React.ComponentProps<"section">) => (
  <section className={classNames("relative border-b border-border px-4 py-8 lg:py-16", className)} {...props}>
    <div className="mx-auto grid w-full max-w-6xl gap-6">{children}</div>
  </section>
);

export const ProfileSectionFrame = ({
  children,
  header,
  ...props
}: { children: React.ReactNode; header: string | null } & Omit<React.ComponentProps<"section">, "children">) => (
  <ProfileSectionLayout {...props}>
    {header ? <h2>{header}</h2> : null}
    {children}
  </ProfileSectionLayout>
);
