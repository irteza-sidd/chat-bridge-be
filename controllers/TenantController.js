import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

export const createTenant = async (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Tenant name is required" });
  }

  const tenantId = uuidv4();
  const dbName = `tenant_${tenantId.replace(/-/g, "")}`;
  const apiKey = uuidv4();

  const tenant = await mongoose.connection.db.collection("tenants").insertOne({
    tenantId,
    name,
    dbName,
    apiKey,
    createdAt: new Date(),
  });

  // Initialize tenant database (MongoDB Atlas creates it on first write)
  const tenantDB = await mongoose.createConnection(
    `mongodb+srv://<username>:<password>@cluster0.mongodb.net/${dbName}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

  // Initialize collections
  tenantDB.model("ChatRoom", require("../models/ChatRoom.js"));
  tenantDB.model("Message", require("../models/Message.js"));

  res.status(201).json({
    success: true,
    message: "Tenant created successfully",
    data: { tenantId, name, dbName, apiKey },
  });
};
