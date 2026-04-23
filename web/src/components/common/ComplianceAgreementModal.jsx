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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Banner, Checkbox, Modal } from '@douyinfe/semi-ui';
import {
  AlertTriangle,
  Gavel,
  Globe,
  Scale,
  ShieldAlert,
} from 'lucide-react';

const sectionStyle = {
  padding: '12px 14px',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-subtle)',
  border: '1px solid var(--border-subtle)',
  marginBottom: 10,
};

const titleStyle = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-primary)',
  marginBottom: 6,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

const listStyle = {
  margin: 0,
  paddingLeft: 18,
  fontSize: 12,
  lineHeight: 1.75,
  color: 'var(--text-secondary)',
};

const ComplianceAgreementModal = ({ t, visible, onAgree, onCancel }) => {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!visible) setChecked(false);
  }, [visible]);

  return (
    <Modal
      title={
        <div className='flex items-center gap-2'>
          <span
            className='w-6 h-6 flex items-center justify-center'
            style={{
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 149, 0, 0.12)',
              color: '#FF9500',
            }}
          >
            <ShieldAlert size={14} />
          </span>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {t('付款前合规使用声明')}
          </span>
        </div>
      }
      visible={visible}
      onOk={onAgree}
      onCancel={onCancel}
      okText={t('同意并继续付款')}
      cancelText={t('取消')}
      okButtonProps={{
        disabled: !checked,
        style: checked
          ? {
              background: 'var(--accent-gradient)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
            }
          : { borderRadius: 'var(--radius-md)' },
      }}
      cancelButtonProps={{ style: { borderRadius: 'var(--radius-md)' } }}
      maskClosable={false}
      size='medium'
      centered
    >
      <Banner
        type='warning'
        fullMode={false}
        closeIcon={null}
        description={t(
          '付款即代表您已仔细阅读并完全同意以下全部合规条款。违规使用将导致账户被立即封禁、余额被没收，并可能触发执法机关协查。',
        )}
        style={{ borderRadius: 'var(--radius-md)', marginBottom: 12 }}
      />

      <div style={{ maxHeight: 360, overflowY: 'auto', paddingRight: 6 }}>
        <div style={sectionStyle}>
          <div style={titleStyle}>
            <Scale size={13} />
            {t('一、中华人民共和国法律法规')}
          </div>
          <ul style={listStyle}>
            <li>
              {t(
                '严格遵守《生成式人工智能服务管理暂行办法》《网络安全法》《数据安全法》《个人信息保护法》《互联网信息服务算法推荐管理规定》等现行法律法规。',
              )}
            </li>
            <li>
              {t(
                '不得生成、诱导生成或传播：煽动颠覆国家政权、破坏国家统一、分裂国家、宣扬恐怖主义与极端主义、煽动民族仇恨、歧视、虚假信息、谣言等内容。',
              )}
            </li>
            <li>
              {t(
                '不得生成淫秽色情、暴力血腥、违反公序良俗的内容；不得生成未经同意的他人肖像、隐私信息、商业秘密。',
              )}
            </li>
            <li>
              {t(
                '不得将本服务用于网络攻击、电信诈骗、恶意群发、伪造证件、假冒他人、侵犯他人合法权益等违法活动。',
              )}
            </li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>
            <Gavel size={13} />
            {t('二、美国及其他普通法系国家法律')}
          </div>
          <ul style={listStyle}>
            <li>
              {t(
                '严禁生成、存储或传播任何儿童性剥削材料（CSAM）—— 在所有国家/地区均为零容忍犯罪（18 U.S.C. § 2252 及相关条款）。',
              )}
            </li>
            <li>
              {t(
                '严禁用于侵犯版权（DMCA）、商标权、商业秘密；严禁生成用于诽谤、骚扰、勒索、起底特定个人的内容。',
              )}
            </li>
            <li>
              {t(
                '严禁向 OFAC 制裁名单（SDN）、受禁运国家（伊朗、朝鲜、古巴、叙利亚及俄罗斯受制裁实体等）提供任何技术交易或服务。',
              )}
            </li>
            <li>
              {t(
                '严禁用于协助规避出口管制（EAR/ITAR），包括但不限于军事、两用技术、高端半导体设计的转让或说明。',
              )}
            </li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>
            <Globe size={13} />
            {t('三、欧盟及其他地区法律')}
          </div>
          <ul style={listStyle}>
            <li>
              {t(
                '遵守《通用数据保护条例》（GDPR）—— 不得未经合法依据处理他人个人数据、跨境传输他人个人信息。',
              )}
            </li>
            <li>
              {t(
                '遵守《欧盟人工智能法》（EU AI Act）—— 不得用于被禁止的高风险场景（社会评分、未经授权的人脸/情绪识别、操控未成年人等）。',
              )}
            </li>
            <li>
              {t(
                '遵守《数字服务法》（DSA）及各国反仇恨言论、反歧视、反恐、反网络霸凌等本地法规。',
              )}
            </li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>
            <AlertTriangle size={13} />
            {t('四、全球通用红线（零容忍）')}
          </div>
          <ul style={listStyle}>
            <li>
              {t(
                '严禁生成涉及儿童性剥削（CSAM）的任何文本、图片、代码或衍生内容。一经发现立即封号并报告执法机关。',
              )}
            </li>
            <li>
              {t(
                '严禁生成生化武器、核武器、放射性武器、化学毒剂的合成、制造或使用指令。',
              )}
            </li>
            <li>
              {t(
                '严禁生成深度伪造（Deepfake）用于欺诈、勒索、非自愿性图像（NCII）、选举操纵、冒充他人。',
              )}
            </li>
            <li>
              {t('严禁用于协助自杀、自残，或煽动、美化极端暴力与仇恨犯罪。')}
            </li>
            <li>
              {t(
                '严禁用于开发、部署自动化网络攻击工具、恶意软件、勒索软件、僵尸网络、漏洞武器化。',
              )}
            </li>
            <li>
              {t(
                '严禁用于诈骗、洗钱、非法博彩、贩毒、人口贩卖、恐怖融资等任何犯罪活动。',
              )}
            </li>
          </ul>
        </div>

        <div style={sectionStyle}>
          <div style={titleStyle}>
            <ShieldAlert size={13} />
            {t('五、用户责任与平台权利')}
          </div>
          <ul style={listStyle}>
            <li>
              {t(
                '用户对通过本服务发送的全部 Prompt 与生成的全部内容承担完整的法律责任。',
              )}
            </li>
            <li>
              {t(
                '本平台仅提供 API 中转服务，不对内容做任何背书或担保，不承担因用户违规使用产生的一切连带责任。',
              )}
            </li>
            <li>
              {t(
                '平台保留以下权利：日志审计、风控扫描、违规即时封号、冻结及没收账户余额、向执法机关提供证据。',
              )}
            </li>
            <li>
              {t(
                '一经发现违规使用，账户内全部余额不予退款，且可能被司法机关追究民事或刑事责任。',
              )}
            </li>
            <li>
              {t(
                '继续付款即视为您已理解并永久接受上述全部条款；如您无法接受，请立即取消并停止使用本服务。',
              )}
            </li>
          </ul>
        </div>
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <Checkbox
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
        >
          <span
            style={{
              fontSize: 13,
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}
          >
            {t(
              '我已完整阅读并同意上述全部合规条款，承诺依法合规使用本服务，对所有生成内容承担全部法律责任。',
            )}
          </span>
        </Checkbox>
      </div>
    </Modal>
  );
};

// ─── Hook: useComplianceGate ───
// 用法：
//   const { gate, modal } = useComplianceGate(t);
//   <Button onClick={() => gate(onlineTopUp)}>确认</Button>
//   {modal}
export function useComplianceGate(t) {
  const [open, setOpen] = useState(false);
  const pendingRef = useRef(null);

  const gate = useCallback((fn) => {
    if (typeof fn !== 'function') return;
    pendingRef.current = fn;
    setOpen(true);
  }, []);

  const handleAgree = useCallback(() => {
    const fn = pendingRef.current;
    pendingRef.current = null;
    setOpen(false);
    if (typeof fn === 'function') {
      Promise.resolve().then(() => fn());
    }
  }, []);

  const handleCancel = useCallback(() => {
    pendingRef.current = null;
    setOpen(false);
  }, []);

  const modal = (
    <ComplianceAgreementModal
      t={t}
      visible={open}
      onAgree={handleAgree}
      onCancel={handleCancel}
    />
  );

  return { gate, modal };
}

export default ComplianceAgreementModal;
