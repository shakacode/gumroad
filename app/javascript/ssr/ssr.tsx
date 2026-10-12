import { createInertiaApp } from "@inertiajs/react";
import createServer from "@inertiajs/react/server";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

import AppWrapper from "../inertia/app_wrapper";
import Layout, { PublicLayout, LoggedInUserLayout } from "../inertia/layout";

// Server-side counterpart of entrypoints/inertia.js. It resolves the same page
// modules and applies the same layout rules, then renders the Inertia page to a
// string for inertia_rails' `ssr_url/render` call. Browser-only setup from the
// client entry (translation guard, request CSRF sync, router hooks, file-drop
// guard) is intentionally absent: it runs after hydration in the browser.

type PageModule = { default: PageComponent };
type PageComponent = React.ComponentType<unknown> & {
  layout?: (page: React.ReactNode) => React.ReactNode;
  publicLayout?: boolean;
  loggedInUserLayout?: boolean;
};

function assignLayout(page: PageComponent) {
  if (page.publicLayout) {
    page.layout ||= (children) => createElement(PublicLayout, { children });
  } else if (page.loggedInUserLayout) {
    page.layout ||= (children) => createElement(LoggedInUserLayout, { children });
  } else {
    page.layout ||= (children) => createElement(Layout, { children });
  }
  return page;
}

const pages = import.meta.glob<PageModule>(["../pages/**/*.tsx", "!../pages/**/*.test.tsx"]);
const jsxPages = import.meta.glob<PageModule>(["../pages/**/*.jsx", "!../pages/**/*.test.jsx"]);

async function resolvePageComponent(name: string) {
  const tsxPath = `../pages/${name}.tsx`;
  const jsxPath = `../pages/${name}.jsx`;
  const loader = pages[tsxPath] ?? jsxPages[jsxPath];
  if (!loader) throw new Error(`Page component not found: ${name}`);
  return assignLayout((await loader()).default);
}

// vite.config.ts defines `process.env` as `{}` for the browser build, so read the
// real environment through globalThis to reach the Node process environment.
const port = Number((globalThis as { process: NodeJS.Process }).process.env.INERTIA_SSR_PORT) || 13714;

createServer(
  (page) =>
    createInertiaApp({
      page,
      render: renderToString,
      resolve: resolvePageComponent,
      title: (title) => title || "Gumroad",
      setup: ({ App, props }) => {
        // useOriginalLocation reads window.location in the browser; on the server it needs the
        // request URL through SSRLocationProvider, which AppWrapper supplies from `href`.
        const global = { href: page.url, ...(props.initialPage.props as Record<string, unknown>) };
        return createElement(AppWrapper, { global: global as never }, createElement(App, props));
      },
    }),
  port,
);
