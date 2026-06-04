import { db } from '@/lib/db/drizzle';
import { plans, teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { 
  getTeamMemberCount, 
  getContactCount, 
  getInstanceCount 
} from '@/lib/db/queries';

export type LimitResource = 'users' | 'contacts' | 'instances';
export type FeatureFlag = 'isAiEnabled' | 'isFlowBuilderEnabled' | 'isCampaignsEnabled' | 'isTemplatesEnabled' | 'isVoiceCallsEnabled';

export async function enforceLimit(teamId: number, resource: LimitResource) {
  // DISABLED: Unlimited free plan - no usage limitations
  return;
}

export async function checkFeature(teamId: number, feature: FeatureFlag) {
  // DISABLED: All features enabled for unlimited free plan
  return true;
}

export async function enforceFeature(teamId: number, feature: FeatureFlag) {
  // DISABLED: All features enabled for unlimited free plan
  return;
}