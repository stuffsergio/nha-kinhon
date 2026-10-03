import zlib from "zlib";

const DEFAULT_THRESHOLD = 512;

/**
 * Brotli-compresses JSON bodies when the client advertises br (gzip still handled by compression middleware).
 */
export function brotliJson({ threshold = DEFAULT_THRESHOLD } = {}) {
  return (req, res, next) => {
    const accept = String(req.headers["accept-encoding"] ?? "");
    if (!/\bbr\b/.test(accept)) {
      next();
      return;
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      let payload;
      try {
        payload = JSON.stringify(body);
      } catch {
        originalJson(body);
        return;
      }

      const raw = Buffer.from(payload, "utf8");
      if (raw.byteLength < threshold) {
        originalJson(body);
        return;
      }

      zlib.brotliCompress(
        raw,
        { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
        (err, compressed) => {
          if (err) {
            originalJson(body);
            return;
          }
          res.statusCode = res.statusCode || 200;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Content-Encoding", "br");
          res.setHeader("Vary", "Accept-Encoding");
          res.removeHeader("Content-Length");
          res.end(compressed);
        },
      );
    };
    next();
  };
}
