# Compose the Profile shell on the server

Base: d66bb3dcf1ce690f1645192d24a94ee410597786. This isolates only the application changes from 3ad266b33; the responsive header change is not included.

The compatibility entry previously put PageShell and Users/Show beneath one client boundary. Compose the shell on the server and expose Users/Show through a dedicated client entry. Providers and visible content remain unchanged. This removes an unnecessary RSC dependency path between the shared shell and Profile implementation.

The baseline already contains server-rendered Product content, streaming views, async Discover props, and streaming gzip. Those remain unchanged. No shared header, receipt, thumbnail, public-file-context, or SSR-cache changes are included.

Validation passed: `npx tsc --noEmit`, changed-file ESLint, and a fresh `NODE_ENV=production RAILS_ENV=benchmark npm run build:public-rsc` in an isolated Docker source directory. The host build first failed because the new worktree had no DATABASE_NAME; the Docker build uses the existing benchmark environment without altering the running source or output. Earlier optimization measurements were against a different combined build and are not claimed as measurements of this isolated branch.
