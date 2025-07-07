import dotenv from "dotenv";

dotenv.config();

/**
 * Returns the string value of an environment variable.
 * If it doesn't exist and a fallback is provided, the fallback is returned.
 * Otherwise, throws an error.
 */
function getString(key, fallback) {
  const value = process.env[key];

  // If there's no value in the environment, either return fallback or throw
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

/**
 * Returns an integer value of an environment variable.
 * If parsing fails or the variable is not found,
 * returns the fallback if provided, otherwise throws an error.
 */
function getInt(key, fallback) {
  const value = process.env[key];

  // Handle missing value first
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  const valAsInt = parseInt(value, 10);

  // If the parsed integer is NaN, return fallback or throw
  if (isNaN(valAsInt)) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(
      `Invalid environment variable for key: ${key} (expected integer)`
    );
  }

  return valAsInt;
}

/**
 * Returns a boolean value of an environment variable.
 * If the variable is not 'true' or 'false',
 * returns the fallback if provided, otherwise throws an error.
 */
function getBool(key, fallback) {
  const value = process.env[key];

  // Handle missing value first
  if (!value) {
    if (fallback !== undefined) {
      return fallback;
    }
    throw new Error(`Missing environment variable: ${key}`);
  }

  // Normalize string to a boolean
  if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  }

  // If it's not strictly 'true'/'false', fallback or throw
  if (fallback !== undefined) {
    return fallback;
  }
  throw new Error(
    `Invalid environment variable for key: ${key} (expected 'true' or 'false')`
  );
}

export { getString, getInt, getBool };
