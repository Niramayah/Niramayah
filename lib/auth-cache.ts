class AuthCache {
  private registrations = new Map<string, { otp: string; expires: number; verified: boolean }>();
  private loginFailures = new Map<string, { failedAttempts: number; lockoutUntil: number | null }>();

  // Registrations
  setRegistrationOtp(email: string, otp: string, expires: number) {
    this.registrations.set(email.toLowerCase(), { otp, expires, verified: false });
  }

  getRegistration(email: string) {
    return this.registrations.get(email.toLowerCase());
  }

  verifyRegistrationOtp(email: string, otp: string): boolean {
    const reg = this.getRegistration(email);
    if (!reg) return false;
    if (reg.otp !== otp) return false;
    if (Date.now() > reg.expires) return false;
    
    // Mark as verified
    reg.verified = true;
    reg.expires = Date.now() + 15 * 60 * 1000; // Extend lifetime for registration form submission
    this.registrations.set(email.toLowerCase(), reg);
    return true;
  }

  isEmailVerified(email: string): boolean {
    const reg = this.getRegistration(email);
    if (!reg) return false;
    return reg.verified && Date.now() <= reg.expires;
  }

  clearRegistration(email: string) {
    this.registrations.delete(email.toLowerCase());
  }

  // Login Rate Limits
  getLoginFailures(email: string) {
    const data = this.loginFailures.get(email.toLowerCase());
    if (!data) return { failedAttempts: 0, lockoutUntil: null };
    
    // If lockout has passed, reset lockoutUntil (but keep failedAttempts count)
    if (data.lockoutUntil && Date.now() > data.lockoutUntil) {
      data.lockoutUntil = null;
      this.loginFailures.set(email.toLowerCase(), data);
    }
    return data;
  }

  recordLoginFailure(email: string) {
    const normalizedEmail = email.toLowerCase();
    const data = this.getLoginFailures(normalizedEmail);
    const failedAttempts = data.failedAttempts + 1;
    let lockoutUntil: number | null = null;

    if (failedAttempts === 3) {
      lockoutUntil = Date.now() + 30 * 1000; // 30 seconds
    } else if (failedAttempts === 5) {
      lockoutUntil = Date.now() + 60 * 1000; // 1 minute
    } else if (failedAttempts >= 7) {
      lockoutUntil = Date.now() + 60 * 60 * 1000; // 1 hour
    }

    this.loginFailures.set(normalizedEmail, { failedAttempts, lockoutUntil });
    return { failedAttempts, lockoutUntil };
  }

  resetLoginFailures(email: string) {
    this.loginFailures.delete(email.toLowerCase());
  }
}

// Global caching for Next.js hot-reloads
const globalVar = global as any;
if (!globalVar.authCache) {
  globalVar.authCache = new AuthCache();
}

export const authCache = globalVar.authCache as AuthCache;
