import { FixedWindowRateLimiter } from '../fixed.window.rate.limiter';

describe('FixedWindowRateLimiter', () => {
  let rateLimiter: FixedWindowRateLimiter;

  beforeEach(() => {
    rateLimiter = new FixedWindowRateLimiter();
  });

  test('should allow requests within limit', () => {
    const userId = 'user1';
    
    for (let i = 0; i < 5; i++) {
      expect(rateLimiter.limitRequest(userId)).toBe(false);
    }
  });

  test('should block requests exceeding limit', () => {
    const userId = 'user1';
    
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.limitRequest(userId);
    }
    
    // Next request should be blocked
    expect(rateLimiter.limitRequest(userId)).toBe(true);
  });

  test('should reset window after time expires', async () => {
    const userId = 'user1';
    
    // Use up the limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.limitRequest(userId);
    }
    
    // Mock time passage
    jest.spyOn(Date, 'now')
      .mockReturnValueOnce(Date.now() + 61000); // 61 seconds later
    
    expect(rateLimiter.limitRequest(userId)).toBe(false);
  });

  test('should handle multiple users independently', () => {
    const user1 = 'user1';
    const user2 = 'user2';
    
    // User1 uses up limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.limitRequest(user1);
    }
    
    // User2 should still be allowed
    expect(rateLimiter.limitRequest(user2)).toBe(false);
    expect(rateLimiter.limitRequest(user1)).toBe(true);
  });
});