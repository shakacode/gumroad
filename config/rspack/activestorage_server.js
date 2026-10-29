// Shared components may import Active Storage, but only browser rendering starts
// its UJS integration. Keep the server bundle on its upload primitives instead.
export { DirectUpload } from "@rails/activestorage/src/direct_upload.js";
export { DirectUploadController } from "@rails/activestorage/src/direct_upload_controller.js";
export { DirectUploadsController } from "@rails/activestorage/src/direct_uploads_controller.js";
export { dispatchEvent } from "@rails/activestorage/src/helpers.js";

export const start = () => {};
