// SSR stand-in for @rails/activestorage. The real package schedules a browser
// autostart on import (document and window), which has no meaning in the Node
// SSR server. Direct uploads only ever run in the browser, so the server bundle
// gets the same names with no behaviour.

export class DirectUpload {
  constructor(..._args: unknown[]) {}

  create(callback: (error: Error | null, blob: unknown) => void) {
    callback(new Error("DirectUpload is not available during server rendering"), null);
  }
}

export function start() {}
