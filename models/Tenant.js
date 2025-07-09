import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  dbName: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Tenant", TenantSchema);
