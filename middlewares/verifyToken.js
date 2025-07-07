import ErrorResponse from "../utils/errorResponse.js";
import jwt from "jsonwebtoken";

const verifyToken = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization?.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("No access token was provided.", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return next(new ErrorResponse("Token has expired.", 401));
    }
    req.user = decoded.user;
    req.token = token;
    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }
};

export default verifyToken;
