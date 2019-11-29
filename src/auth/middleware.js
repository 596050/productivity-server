import jwt from "jsonwebtoken";

const unauthorized = res => res.status(401).json("unauthorized");

export const authenticationMiddleware = (req, res, next) => {
  const authorization = req.header("Authorization");
  const JWT_SECRET = process.env.JWT_SECRET;
  const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;
  const EXPIRATION = parseInt(TOKEN_EXPIRATION, 10);
  if (!authorization) {
    return unauthorized(res);
  }
  const token = authorization.replace("Bearer: ", "");
  if (!token) {
    return unauthorized(res);
  }
  return jwt.verify(token, JWT_SECRET, (err, decoded) => {
    const now = Date.now();
    if (
      err ||
      !decoded.iat ||
      decoded.iat + EXPIRATION !== decoded.exp ||
      decoded.iat + EXPIRATION < now ||
      decoded.exp < now
    ) {
      console.log(
        "===== TOKEN NOT VERIFIED:",
        err,
        decoded
        // decoded.exp < now,
        // decoded.iat
      );
      return unauthorized(res);
    }
    req.user = decoded;
    console.log("USER:", req.user);
    next();
  });
};

export const createAuthorizationMiddleware = model => (req, res, next) =>
  authenticationMiddleware(req, res, () => {
    if (!req.user) {
      return unauthorized(res);
    }
    return model
      .authorize(req)
      .then(next)
      .catch(e => {
        console.error(e);
        return unauthorized(res);
      });
  });
