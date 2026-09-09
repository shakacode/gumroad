"use client";

import { MenuFilter, X } from "@boxicons/react";
import * as Dialog from "@radix-ui/react-dialog";
import * as React from "react";

import { Button } from "$app/components/Button";
import { Sheet } from "$app/components/ui/Sheet";

export default function DiscoverMobileMenu({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        color="filled"
        size="icon"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Categories"
      >
        <MenuFilter className="size-5" />
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        modal
        className="w-[calc(20rem+3rem)] bg-transparent p-0 pr-12 md:left-0 md:border-l-0"
      >
        <Dialog.Title className="sr-only">Categories</Dialog.Title>
        <Dialog.Close
          className="absolute top-4 right-4 z-40 cursor-pointer bg-transparent all-unset"
          aria-label="Close menu"
        >
          <X className="size-6 text-white" />
        </Dialog.Close>
        <nav className="h-full w-80 overflow-y-auto bg-background" aria-label="Categories">
          {children}
        </nav>
      </Sheet>
    </>
  );
}
