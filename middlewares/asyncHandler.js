import { connection } from "../config/db.js";

const asyncHandler =
  (fn, useTransaction = false) =>
  async (req, res, next) => {
    let session;

    if (useTransaction) {
      session = await connection.startSession();
      session.startTransaction();
      req.session = session;
    }

    try {
      await fn(req, res, next);

      if (useTransaction && session.inTransaction()) {
        await session.commitTransaction();
      }
    } catch (error) {
      if (useTransaction && session.inTransaction()) {
        await session.abortTransaction();
      }
      next(error);
    } finally {
      if (useTransaction) {
        session.endSession();
      }
    }
  };

export default asyncHandler;
