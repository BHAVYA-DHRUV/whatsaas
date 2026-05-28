import { NextResponse, NextRequest } from 'next/server';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { checkFeature, FeatureFlag } from '@/lib/limits';

const DISABLED_FEATURES = {
  isAiEnabled: false,
  isFlowBuilderEnabled: false,
  isCampaignsEnabled: false,
  isTemplatesEnabled: false,
  isVoiceCallsEnabled: false,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    if (searchParams.get('all') === '1') {
      const user = await getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const team = await getTeamForUser();
      if (!team) {
        return NextResponse.json(DISABLED_FEATURES);
      }

      const [
        isAiEnabled,
        isFlowBuilderEnabled,
        isCampaignsEnabled,
        isTemplatesEnabled,
        isVoiceCallsEnabled,
      ] = await Promise.all([
        checkFeature(team.id, 'isAiEnabled'),
        checkFeature(team.id, 'isFlowBuilderEnabled'),
        checkFeature(team.id, 'isCampaignsEnabled'),
        checkFeature(team.id, 'isTemplatesEnabled'),
        checkFeature(team.id, 'isVoiceCallsEnabled'),
      ]);

      return NextResponse.json({
        isAiEnabled,
        isFlowBuilderEnabled,
        isCampaignsEnabled,
        isTemplatesEnabled,
        isVoiceCallsEnabled,
      });
    }

    const team = await getTeamForUser();
    if (!team) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const feature = searchParams.get('name') as FeatureFlag;

    if (!feature) {
      return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
    }

    const hasAccess = await checkFeature(team.id, feature);

    return NextResponse.json({ hasAccess });

  } catch (error: any) {
    console.error('Erro ao verificar feature:', error.message);
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
  }
}
