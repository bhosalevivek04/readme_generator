// Quota management for Gemini API
interface QuotaInfo {
  model: string;
  dailyLimit: number;
  used: number;
  resetTime: number;
}

class QuotaManager {
  private quotas: Map<string, QuotaInfo> = new Map();
  
  // Estimated free tier limits as of 2025
  private readonly FREE_TIER_LIMITS = {
    'gemini-3-flash-preview': 15,  // Latest preview model
    'gemini-2.5-flash': 20,        // Reduced from 250
    'gemini-2.5-pro': 0,           // Often 0 for free accounts
  };
  
  constructor() {
    this.initializeQuotas();
  }
  
  private initializeQuotas() {
    const today = new Date().toDateString();
    const resetTime = new Date().setHours(24, 0, 0, 0); // Reset at midnight
    
    Object.entries(this.FREE_TIER_LIMITS).forEach(([model, limit]) => {
      const stored = localStorage.getItem(`quota_${model}_${today}`);
      const used = stored ? parseInt(stored) : 0;
      
      this.quotas.set(model, {
        model,
        dailyLimit: limit,
        used,
        resetTime
      });
    });
  }
  
  canUseModel(model: string): boolean {
    const quota = this.quotas.get(model);
    if (!quota) return true; // Unknown model, allow attempt
    
    // Check if quota reset time has passed
    if (Date.now() > quota.resetTime) {
      quota.used = 0;
      quota.resetTime = new Date().setHours(24, 0, 0, 0);
    }
    
    return quota.used < quota.dailyLimit;
  }
  
  recordUsage(model: string) {
    const quota = this.quotas.get(model);
    if (quota) {
      quota.used++;
      const today = new Date().toDateString();
      localStorage.setItem(`quota_${model}_${today}`, quota.used.toString());
    }
  }
  
  getRemainingQuota(model: string): number {
    const quota = this.quotas.get(model);
    return quota ? Math.max(0, quota.dailyLimit - quota.used) : Infinity;
  }
  
  getRecommendedModel(): string {
    // Return the model with the most remaining quota
    let bestModel = 'gemini-2.5-flash';
    let maxRemaining = 0;
    
    for (const [model] of this.quotas) {
      if (this.canUseModel(model)) {
        const remaining = this.getRemainingQuota(model);
        if (remaining > maxRemaining) {
          maxRemaining = remaining;
          bestModel = model;
        }
      }
    }
    
    return bestModel;
  }
}

export const quotaManager = new QuotaManager();