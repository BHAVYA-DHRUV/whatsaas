export type LimitResource = 'users' | 'contacts' | 'instances';
export type FeatureFlag = 'isAiEnabled' | 'isFlowBuilderEnabled' | 'isCampaignsEnabled' | 'isTemplatesEnabled' | 'isVoiceCallsEnabled';

export async function enforceLimit(_teamId: number, _resource: LimitResource) {
  // DISABLED: Unlimited free plan - no usage limitations
  return;
}

export async function checkFeature(_teamId: number, _feature: FeatureFlag) {
  // DISABLED: All features enabled for unlimited free plan
  return true;
}

export async function enforceFeature(_teamId: number, _feature: FeatureFlag) {
  // DISABLED: All features enabled for unlimited free plan
  return;
}