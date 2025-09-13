/**
 * Rate Limiter - Manages API request limits and prevents abuse
 */

class RateLimiter {
  constructor() {
    this.requests = new Map(); // userId -> request history
    this.limits = {
      perMinute: 20,
      perHour: 100,
      perDay: 500
    };
    this.windows = {
      minute: 60 * 1000,
      hour: 60 * 60 * 1000,
      day: 24 * 60 * 60 * 1000
    };
  }

  /**
   * Check if request is allowed for user
   */
  isAllowed(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.getUserRequests(userId);
    
    // Clean old requests
    this.cleanOldRequests(userRequests, now);
    
    // Check each time window
    const checks = [
      { window: this.windows.minute, limit: this.limits.perMinute, name: 'minute' },
      { window: this.windows.hour, limit: this.limits.perHour, name: 'hour' },
      { window: this.windows.day, limit: this.limits.perDay, name: 'day' }
    ];

    for (const check of checks) {
      const recentRequests = userRequests.filter(timestamp => 
        now - timestamp < check.window
      );
      
      if (recentRequests.length >= check.limit) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${check.limit} requests per ${check.name}`,
          resetTime: Math.min(...recentRequests) + check.window,
          remaining: 0
        };
      }
    }

    return {
      allowed: true,
      remaining: {
        minute: this.limits.perMinute - userRequests.filter(t => now - t < this.windows.minute).length,
        hour: this.limits.perHour - userRequests.filter(t => now - t < this.windows.hour).length,
        day: this.limits.perDay - userRequests.filter(t => now - t < this.windows.day).length
      }
    };
  }

  /**
   * Record a request for user
   */
  recordRequest(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.getUserRequests(userId);
    
    userRequests.push(now);
    this.requests.set(userId, userRequests);
    
    // Clean old requests periodically
    if (userRequests.length % 10 === 0) {
      this.cleanOldRequests(userRequests, now);
    }
  }

  /**
   * Get user request history
   */
  getUserRequests(userId) {
    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }
    return this.requests.get(userId);
  }

  /**
   * Clean old requests outside all windows
   */
  cleanOldRequests(userRequests, now) {
    const maxWindow = Math.max(...Object.values(this.windows));
    const cutoff = now - maxWindow;
    
    // Remove requests older than the longest window
    const filtered = userRequests.filter(timestamp => timestamp > cutoff);
    return filtered;
  }

  /**
   * Update rate limits
   */
  updateLimits(newLimits) {
    this.limits = { ...this.limits, ...newLimits };
  }

  /**
   * Get current limits
   */
  getLimits() {
    return { ...this.limits };
  }

  /**
   * Get user statistics
   */
  getUserStats(userId = 'anonymous') {
    const now = Date.now();
    const userRequests = this.getUserRequests(userId);
    
    return {
      total: userRequests.length,
      lastMinute: userRequests.filter(t => now - t < this.windows.minute).length,
      lastHour: userRequests.filter(t => now - t < this.windows.hour).length,
      lastDay: userRequests.filter(t => now - t < this.windows.day).length,
      remaining: this.isAllowed(userId).remaining
    };
  }

  /**
   * Reset user limits (for testing or admin purposes)
   */
  resetUser(userId) {
    this.requests.delete(userId);
  }

  /**
   * Clear all rate limit data
   */
  clear() {
    this.requests.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

export default rateLimiter;