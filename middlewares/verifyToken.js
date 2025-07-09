import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export default async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  const apiKey = req.headers["x-api-key"];
  const tenantId = req.body.tenantId || req.query.tenantId;

  if (!token || !apiKey || !tenantId) {
    return res
      .status(401)
      .json({ error: "Token, API key, and tenantId required" });
  }

  try {
    const tenant = await mongoose.connection.db
      .collection("tenants")
      .findOne({ tenantId, apiKey });
    if (!tenant) {
      return res.status(401).json({ error: "Invalid API key or tenant" });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded.user;
    next();
  } catch (err) {
    console.error(err);
    res.status(401).json({ error: "Invalid token" });
  }
};
