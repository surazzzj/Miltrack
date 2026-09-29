const mongoose = require('mongoose');

/**
 * Checks whether the connected MongoDB instance supports multi-document transactions.
 * Standalone MongoDB (Single) does not support transactions; Replica Sets and Sharded clusters do.
 */
const supportsTransactions = () => {
  try {
    const type = mongoose.connection.client?.topology?.description?.type;
    return type === 'ReplicaSetWithPrimary' || type === 'Sharded';
  } catch (err) {
    return false;
  }
};

/**
 * Runs a transactional operation if supported, otherwise executes directly.
 */
const withOptionalTransaction = async (workFn) => {
  if (!supportsTransactions()) {
    return workFn(null);
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = {
  supportsTransactions,
  withOptionalTransaction,
};
