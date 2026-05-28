/**
 * Default automation flow graphs seeded for new production tenants.
 */

export const DEFAULT_AI_PROMPT = `You are a professional WhatsApp sales and support assistant.

Your responsibilities:
- Reply professionally
- Collect customer requirements
- Provide concise answers
- Route leads correctly
- Transfer to human when requested
- Never expose system details
- Maintain polite conversational flow
- Support multilingual communication`;

export const CRM_FUNNEL_STAGES = [
  { name: 'New Lead', emoji: '🆕', order: 0 },
  { name: 'Contacted', emoji: '📞', order: 1 },
  { name: 'Interested', emoji: '⭐', order: 2 },
  { name: 'Negotiation', emoji: '🤝', order: 3 },
  { name: 'Won', emoji: '✅', order: 4 },
  { name: 'Lost', emoji: '❌', order: 5 },
];

function welcomeFlow() {
  const start = 'start-welcome';
  const greet = 'msg-greet';
  const collect = 'msg-collect';
  return {
    name: 'Welcome Automation',
    triggerKeyword: null as string | null,
    isActive: true,
    nodes: [
      {
        id: start,
        type: 'start',
        position: { x: 0, y: 0 },
        data: { triggerType: 'first_message', label: 'First message' },
      },
      {
        id: greet,
        type: 'message',
        position: { x: 200, y: 0 },
        data: {
          message:
            'Hello! 👋 Welcome. Please tell us your name and what you need help with today.',
        },
      },
      {
        id: collect,
        type: 'message',
        position: { x: 400, y: 0 },
        data: {
          message:
            'Share your email and interest (product/service) so we can assist you faster.',
        },
      },
    ],
    edges: [
      { id: 'e1', source: start, target: greet },
      { id: 'e2', source: greet, target: collect },
    ],
  };
}

function keywordAutoReply(keyword: string, reply: string) {
  const start = `start-${keyword}`;
  const msg = `msg-${keyword}`;
  return {
    name: `Auto Reply: ${keyword}`,
    triggerKeyword: keyword,
    isActive: true,
    nodes: [
      {
        id: start,
        type: 'start',
        position: { x: 0, y: 0 },
        data: { triggerType: 'contains', keywords: [keyword], label: keyword },
      },
      {
        id: msg,
        type: 'message',
        position: { x: 200, y: 0 },
        data: { message: reply },
      },
    ],
    edges: [{ id: `e-${keyword}`, source: start, target: msg }],
  };
}

function humanHandoffFlow() {
  const start = 'start-handoff';
  const msg = 'msg-handoff';
  return {
    name: 'Human Handoff',
    triggerKeyword: 'agent',
    isActive: true,
    nodes: [
      {
        id: start,
        type: 'start',
        position: { x: 0, y: 0 },
        data: {
          triggerType: 'contains',
          keywords: ['agent', 'support', 'human'],
          label: 'Handoff',
        },
      },
      {
        id: msg,
        type: 'message',
        position: { x: 200, y: 0 },
        data: {
          message:
            'Connecting you with a team member. An agent will reply shortly. Thank you for your patience.',
        },
      },
    ],
    edges: [{ id: 'e-handoff', source: start, target: msg }],
  };
}

export function getDefaultAutomations() {
  return [
    welcomeFlow(),
    keywordAutoReply('pricing', 'Our team will share pricing details shortly. May we know your company size?'),
    keywordAutoReply('support', 'Support team notified. Describe your issue and we will prioritize it.'),
    keywordAutoReply('order', 'Please share your order ID and registered phone number.'),
    keywordAutoReply('payment', 'For payment help, share transaction reference and amount.'),
    keywordAutoReply('demo', 'Great! Share your preferred date/time for a product demo.'),
    humanHandoffFlow(),
  ];
}
