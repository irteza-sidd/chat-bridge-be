import ErrorResponse from "../utils/errorResponse.js";

const verifyRole = (...roles) => {
  return async (req, res, next) => {
    if (!req?.userRole) {
      return next(new ErrorResponse("User role not found", 403));
    }

    // Check if the user's role is included in the roles passed to the middleware
    const isAllowed = roles.includes(req.userRole);

    if (!isAllowed) {
      return next(new ErrorResponse("Permission Denied", 403));
    }

    next();
  };
};

export default verifyRole;
