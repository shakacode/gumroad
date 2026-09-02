const http2 = require("node:http2");

const port = Number(process.env.RENDERER_PORT) || 3800;
const client = http2.connect(`http://127.0.0.1:${port}`);
const request = client.request({ ":path": "/health" });

const finish = (status) => {
  request.close();
  client.close();
  process.exit(status);
};

client.on("error", () => finish(1));
request.on("error", () => finish(1));
request.on("response", (headers) => finish(headers[":status"] === 200 ? 0 : 1));
request.end();
setTimeout(() => finish(1), 1000).unref();
