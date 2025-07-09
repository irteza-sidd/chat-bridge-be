import mongoose from "mongoose";

const tenantConnections = {};

export const getTenantDB = async (tenantId) => {
  if (tenantConnections[tenantId]) {
    return tenantConnections[tenantId];
  }

  const metadataDB = mongoose.connection;
  const tenant = await metadataDB.collection("tenants").findOne({ tenantId });

  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`);
  }

  const tenantDB = mongoose.createConnection(
    `mongodb+srv://irteza-sidd:Hasham%401999@cluster0.fn2a44a.mongodb.net/${tenant.dbName}?retryWrites=true&w=majority`,
    { useNewUrlParser: true, useUnifiedTopology: true }
  );

  tenantConnections[tenantId] = tenantDB;
  return tenantDB;
};
