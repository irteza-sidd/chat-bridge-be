import Counter from "../models/Counter.js";

const autoIncrementID = (schema, options) => {
  if (!options || !options.field) {
    throw new Error("You must provide 'field' option for auto-increment.");
  }

  const fieldName = options.field;
  const modelName = options.modelName;
  const prefix = options.prefix || "";
  const paddingLength = options.length || 3;

  schema.pre("save", async function (next) {
    if (!this.isNew) return next();

    try {
      let counter = await Counter.findOne({ modelName });

      if (!counter) {
        counter = new Counter({ modelName, lastValue: 1 });
      } else {
        counter.lastValue += 1;
      }

      await counter.save();

      const paddedID = String(counter.lastValue).padStart(paddingLength, "0");
      this[fieldName] = prefix ? `${prefix}-${paddedID}` : paddedID;

      next();
    } catch (err) {
      throw new Error(err.message);
    }
  });
};

export default autoIncrementID;
