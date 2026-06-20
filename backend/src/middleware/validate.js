import { ValidationError } from "../utils/errors.js";

export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map(
        (i) => `${i.path.join(".")}: ${i.message}`
      );
      throw new ValidationError(messages.join("; "));
    }
    req.body = result.data;
    next();
  };
}
