const PROVIDER_LOGO_MAP = {
  openrouter: '/imgs/providers/openrouter.ico',
  ollama: '/imgs/providers/ollama.png',
  openai: '/imgs/providers/openai.png',
  siliconcloud: '/imgs/providers/siliconflow.ico',
  deepseek: '/imgs/providers/deepseek.ico',
  '302ai': '/imgs/providers/302ai.ico',
  zhipu: '/imgs/providers/zhipu.png',
  doubao: '/imgs/providers/volcengine.png',
  groq: '/imgs/providers/groq.ico',
  grok: '/imgs/providers/grok.svg',
  alibailian: '/imgs/providers/alibailian.ico',
  cheaperinference: '/imgs/providers/cheaperinference.svg'
};

const PROVIDER_PRIORITY = ['openrouter'];

export function normalizeProviderId(providerId = '', providerName = '') {
  const raw = String(providerId || providerName || '')
    .trim()
    .toLowerCase();
  if (!raw) return '';

  const normalized = raw.replace(/[\s_-]/g, '');

  if (normalized === 'openrouter' || normalized === 'openrouterai') return 'openrouter';
  if (normalized === 'openai') return 'openai';
  if (normalized === 'siliconflow' || normalized === 'siliconcloud') return 'siliconcloud';
  if (normalized === 'zhipuai' || normalized === 'zhipu') return 'zhipu';
  if (normalized === 'volcengine' || normalized === 'doubao') return 'doubao';
  if (normalized === 'alibabailian' || normalized === 'alibailian') return 'alibailian';
  return normalized;
}

export function getProviderLogo(providerId = '', providerName = '') {
  const normalizedId = normalizeProviderId(providerId, providerName);
  return PROVIDER_LOGO_MAP[normalizedId] || '/imgs/models/default.svg';
}

export function getProviderPriority(providerId = '', providerName = '') {
  const normalizedId = normalizeProviderId(providerId, providerName);
  const index = PROVIDER_PRIORITY.indexOf(normalizedId);
  return index === -1 ? PROVIDER_PRIORITY.length : index;
}

export function sortProvidersByPriority(list = [], getId = item => item?.id || item?.providerId || item) {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    const aPriority = getProviderPriority(getId(a), a?.name || a?.providerName || a?.label);
    const bPriority = getProviderPriority(getId(b), b?.name || b?.providerName || b?.label);
    if (aPriority !== bPriority) return aPriority - bPriority;

    const aName = String(a?.name || a?.providerName || a?.label || getId(a) || '');
    const bName = String(b?.name || b?.providerName || b?.label || getId(b) || '');
    return aName.localeCompare(bName);
  });
}
