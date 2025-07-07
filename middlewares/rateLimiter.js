const WINDOW_SIZE_IN_MINUTES = 1;
const MAX_REQUESTS_PER_WINDOW = 50;

// object to handle memory storage

const requestCounts = {};

const rateLimiter = (req, res, next) => {
  const currentTime = Date.now();
  const userIp = req.ip; // or req.headers['x-forwarded-for'] for proxies

  // Convert window size from minutes to milliseconds
  const windowSizeInMs = WINDOW_SIZE_IN_MINUTES * 60 * 1000;

  if (!requestCounts[userIp]) {
    // First request from this IP
    requestCounts[userIp] = {
      count: 1,
      windowStart: currentTime,
    };
    next();
  } else {
    const elapsedTime = currentTime - requestCounts[userIp].windowStart;

    // Check if current time is still within the window
    if (elapsedTime < windowSizeInMs) {
      // If still in the window, increment the count
      if (requestCounts[userIp].count >= MAX_REQUESTS_PER_WINDOW) {
        // Too many requests in the current window
        return res.status(429).json({
          error: "Too many requests. Please try again later.",
        });
      } else {
        // Increment the count and move on
        requestCounts[userIp].count += 1;
        next();
      }
    } else {
      // Window has expired, reset count and timestamp
      requestCounts[userIp].count = 1;
      requestCounts[userIp].windowStart = currentTime;
      next();
    }
  }
};

export default rateLimiter;
