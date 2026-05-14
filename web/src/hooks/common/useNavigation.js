/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useMemo } from 'react';
import {
  ShieldCheck,
  Terminal,
  Gauge,
  Calculator,
  Wallet,
  Zap,
} from 'lucide-react';
import { isAdmin, isSkillPlazaVisible } from '../../helpers';

export const useNavigation = (t, docsLink, headerNavModules, status) => {
  const mainNavLinks = useMemo(() => {
    // SKILLS 广场 visibility is computed from the backend status payload
    // (master switch + test-mode allow-list). When the module is hidden
    // for the current viewer, the entry is filtered out entirely below.
    // Admin-only items (admin console, etc.) use the local isAdmin()
    // check, which reads role from localStorage.
    const isAdminViewer = isAdmin();
    const skillPlazaVisible = isSkillPlazaVisible(status);
    // 默认配置，如果没有传入配置则显示所有模块
    const defaultModules = {
      home: true,
      console: true,
      pricing: true,
      docs: true,
      about: true,
    };

    // 使用传入的配置或默认配置
    const modules = headerNavModules || defaultModules;

    const allLinks = [
      {
        text: t('首页'),
        itemKey: 'home',
        to: '/',
      },
      {
        text: t('控制台'),
        itemKey: 'console',
        to: '/console',
      },
      {
        text: t('模型广场'),
        itemKey: 'pricing',
        to: '/pricing',
      },
      {
        text: t('价格'),
        itemKey: 'plans',
        to: '/plans',
      },
      {
        text: t('文档'),
        itemKey: 'docs',
        to: '/docs',
      },
      {
        text: t('SKILLS 广场'),
        itemKey: 'skills',
        to: '/skills',
      },
      {
        text: t('工具'),
        itemKey: 'tools',
        children: [
          {
            text: t('模型验真'),
            itemKey: 'verifier',
            to: '/verifier',
            description: t('验证代理是否真的在响应目标模型'),
            icon: React.createElement(ShieldCheck, { size: 16 }),
          },
          {
            text: t('cURL 生成器'),
            itemKey: 'curl-gen',
            to: '/tools/curl',
            description: t('可视化构造请求,一键生成可复制代码'),
            icon: React.createElement(Terminal, { size: 16 }),
          },
          {
            text: t('Token 计算器'),
            itemKey: 'tokens',
            to: '/tools/tokens',
            description: t('估算 Token 数量并对比多模型调用成本'),
            icon: React.createElement(Calculator, { size: 16 }),
          },
          {
            text: t('端点延迟测试'),
            itemKey: 'latency',
            to: '/tools/latency',
            description: t('连续探测,统计 P50 / P95 / 首字延迟'),
            icon: React.createElement(Gauge, { size: 16 }),
          },
          {
            text: t('缓存节省计算器'),
            itemKey: 'cache-calc',
            to: '/tools/cache',
            description: t('计算 Prompt Caching 能节省多少成本'),
            icon: React.createElement(Zap, { size: 16 }),
          },
          {
            text: t('余额查询'),
            itemKey: 'balance',
            to: '/tools/balance',
            description: t('查询 API Key 在各平台的剩余额度'),
            icon: React.createElement(Wallet, { size: 16 }),
          },
        ],
      },
    ];

    // 根据配置过滤导航链接
    return allLinks.filter((link) => {
      // adminOnly links are hidden for non-admin viewers regardless of modules config.
      if (link.adminOnly && !isAdminViewer) {
        return false;
      }
      if (link.itemKey === 'docs') {
        return modules.docs !== false;
      }
      if (link.itemKey === 'tools') {
        return false; // hidden from top menu (routes remain accessible)
      }
      if (link.itemKey === 'plans') {
        return true; // always visible
      }
      if (link.itemKey === 'skills') {
        // Driven by isSkillPlazaVisible(status). When the master switch
        // is off, or test-mode is on and the viewer isn't allow-listed,
        // hide the entry. Admins reach admin pages via /console — they
        // don't need the public nav entry to do their work.
        return skillPlazaVisible;
      }
      if (link.itemKey === 'pricing') {
        // 支持新的pricing配置格式
        return typeof modules.pricing === 'object'
          ? modules.pricing.enabled
          : modules.pricing;
      }
      return modules[link.itemKey] === true;
    });
  }, [t, docsLink, headerNavModules, status]);

  return {
    mainNavLinks,
  };
};
