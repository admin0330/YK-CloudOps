export type Lang = 'zh' | 'en';

const translations: Record<string, Record<Lang, string>> = {
  siteName: { zh: 'ym1r', en: 'ym1r' },
  heroSubtitle: { zh: '运维管理中心', en: 'Server Management Center' },
  heroDescription: {
    zh: '把服务器管理、权限审计、日志分析和 AI 运维助手放在一个入口。',
    en: 'Put server management, permission auditing, log analysis, and an AI ops assistant into one entry.',
  },
  ctaPrimary: { zh: '运维主页', en: 'Ops Home' },
  ctaSecondary: { zh: '次级入口', en: 'Secondary Entry' },
  navHome: { zh: '首页', en: 'Home' },
  navPortal: { zh: '入口', en: 'Portal' },
  navCloudOps: { zh: '运维助手', en: 'Assistant' },
  linkGitHub: { zh: 'GitHub', en: 'GitHub' },
  footerTagline: {
    zh: '主页聚焦运维，次级入口承载个人与项目。',
    en: 'The home page focuses on ops, while the secondary entry holds profile and project content.',
  },
  footerChat: { zh: '运维助手', en: 'CloudOps' },
  s2Title: { zh: '运维优先', en: 'Ops First' },
  s2Sub: {
    zh: '主页直接进入运维中心，减少干扰，把常用功能放到同一处。',
    en: 'The homepage goes straight to the ops center, reducing noise and keeping common actions together.',
  },
  s2Explore: { zh: '查看运维中心', en: 'Explore Ops Center' },
  s2Card1Title: { zh: '服务器管理', en: 'Server Management' },
  s2Card1Desc: { zh: '集中查看服务器状态、连接和关键告警。', en: 'View server status, connections, and key alerts in one place.' },
  s2Card2Title: { zh: '权限与审计', en: 'Permissions & Audit' },
  s2Card2Desc: { zh: '统一管理账号、权限和执行记录。', en: 'Manage accounts, permissions, and execution logs together.' },
  s2Card3Title: { zh: 'AI 运维助手', en: 'AI Ops Assistant' },
  s2Card3Desc: { zh: '协助排障、解释报错并生成安全建议。', en: 'Help troubleshoot, explain errors, and generate safe suggestions.' },
  s3Title: { zh: '运维概览', en: 'Ops Snapshot' },
  s3P1: {
    zh: '把服务器管理、日志分析、权限审计和 AI 排障放在同一个入口。',
    en: 'Server management, log analysis, permission auditing, and AI troubleshooting live in one entry point.',
  },
  s3P2: {
    zh: 'AI 只作为运维助手，帮你解释错误并给出修复建议。',
    en: 'AI works only as an ops assistant, helping explain errors and suggest fixes.',
  },
  s4Title: { zh: '次级入口', en: 'Secondary Entry' },
  s4Sub: { zh: '个人主页、项目和 GitHub 都收在这里。', en: 'Profile, projects, and GitHub live here.' },
  s4Proj1Title: { zh: '个人主页', en: 'Profile' },
  s4Proj1Desc: { zh: '查看我的个人介绍、背景和相关记录。', en: 'My profile, background, and a few notes.' },
  s4Proj2Title: { zh: '项目', en: 'Projects' },
  s4Proj2Desc: { zh: '查看我在做的项目、工具和可扩展内容。', en: 'Active projects, tools, and extendable work.' },
  s4Proj3Title: { zh: 'GitHub', en: 'GitHub' },
  s4Proj3Desc: { zh: '查看源码、演示和开源内容。', en: 'Source code, demos, and open-source work.' },
};

export function t(lang: Lang, key: string) {
  return translations[key]?.[lang] ?? key;
}

export function getHomeLang(): Lang {
  try {
    const saved = localStorage.getItem('ym1r-lang');
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {}
  return 'zh';
}
