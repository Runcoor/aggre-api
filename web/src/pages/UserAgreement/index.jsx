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

import React from 'react';
import { useTranslation } from 'react-i18next';
import LegalPage from '../Legal/LegalPage';

const UserAgreement = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'overview',
      title: t('服务概述'),
      paragraphs: [
        t(
          '本服务是一个聚合多家上游 AI 大模型提供方的 API 中转网关。我们仅负责请求转发、计费结算与服务稳定性保障，不对上游模型生成的内容做任何背书或担保。',
        ),
        t(
          '本协议是您（以下简称"用户"）与平台运营方（以下简称"我们"或"平台"）之间就本服务达成的具有法律约束力的文件。使用本服务即视为您已仔细阅读、理解并同意本协议的全部条款。',
        ),
        t(
          '您必须年满 18 岁（或您所在司法辖区的法定成年年龄），或已取得监护人同意，方可注册使用本服务。',
        ),
      ],
    },
    {
      id: 'account',
      title: t('账户与使用规范'),
      paragraphs: [
        t(
          '注册账户时，请提供真实、准确、完整的信息。一个自然人或法律主体仅可注册一个账户，禁止倒卖、共享账户或使用他人身份注册。',
        ),
      ],
      list: [
        t(
          '您应妥善保管账户凭证、API Key、双因素认证设备；因凭证泄漏造成的任何损失由您自行承担。',
        ),
        t(
          '发现账户被盗用或未经授权访问时，应立即通知我们并协助调查。',
        ),
        t(
          '禁止多 IP 高频切换、自动化爬取上游接口、流量转售等规避风控的行为。',
        ),
        t(
          '未经我们书面许可，不得将 API 凭证嵌入客户端应用直接对终端用户开放。',
        ),
      ],
    },
    {
      id: 'compliance',
      title: t('合规使用红线（多法域）'),
      paragraphs: [
        t(
          '使用本服务时，您必须同时遵守您所在地区、目标用户所在地区以及服务部署地区的全部适用法律法规。违规使用将导致账户被立即封禁、余额被没收，并可能触发执法机关协查。',
        ),
      ],
      list: [
        t(
          '中国大陆：严格遵守《生成式人工智能服务管理暂行办法》《网络安全法》《数据安全法》《个人信息保护法》《互联网信息服务算法推荐管理规定》等法规；不得生成危害国家安全、煽动颠覆政权、破坏社会秩序、淫秽色情、暴力血腥、虚假信息或侵犯他人合法权益的内容。',
        ),
        t(
          '美国与出口管制：严禁生成、存储、传播任何儿童性剥削材料（CSAM，18 U.S.C. § 2252）；严禁向 OFAC 制裁名单（SDN）及受禁运国家（伊朗、朝鲜、古巴、叙利亚及特定俄罗斯实体）提供服务；严禁协助规避 EAR/ITAR 出口管制。',
        ),
        t(
          '欧盟与其他地区：遵守 GDPR、EU AI Act、Digital Services Act 等法规；不得用于被禁止的高风险场景（社会评分、未经授权的人脸/情绪识别、操控未成年人等）。',
        ),
        t(
          '全球零容忍红线：严禁生成 CSAM；严禁生成生化、核、放射性、化学武器合成指令；严禁深度伪造（Deepfake）用于欺诈、勒索、非自愿性图像（NCII）、冒充他人；严禁协助自杀/自残；严禁开发自动化网络攻击工具、恶意软件、勒索软件；严禁用于诈骗、洗钱、贩毒、人口贩卖、恐怖融资等犯罪活动。',
        ),
      ],
      note: t(
        '平台保留以下权利：日志审计、风控扫描、违规即时封号、冻结并没收账户全部余额、向执法机关提供证据。一经发现违规，账户余额不予退款，且可能被司法机关追究民事或刑事责任。',
      ),
    },
    {
      id: 'responsibility',
      title: t('用户责任'),
      paragraphs: [
        t(
          '用户对通过本服务发送的全部 Prompt 与生成的全部内容承担完整的法律责任。',
        ),
      ],
      list: [
        t(
          '您应自行评估生成内容的法律、伦理、业务风险，并承担因使用或传播所产生的全部后果。',
        ),
        t(
          '若您将本服务整合到面向公众的产品中，应当在您的产品界面明确告知最终用户正在与 AI 交互，并提供适当的免责声明与内容审核机制。',
        ),
        t(
          '若您对外转售或分发本服务，您应对您的终端用户履行对等的合规告知义务，并对其违规行为承担连带责任。',
        ),
        t(
          '本平台仅提供 API 中转服务，不对用户的具体使用目的做任何背书，亦不承担因用户违规使用所产生的一切连带责任。',
        ),
      ],
    },
    {
      id: 'billing',
      title: t('计费、违约与终止'),
      paragraphs: [
        t(
          '本服务按上游调用量实时计费，具体规则以控制台展示的当前价格为准。您应确保账户余额充足或订阅处于有效状态。一经完成充值或订阅付款、服务即刻启用的，除法律强制情形外，不予退款。',
        ),
      ],
      list: [
        t(
          '违反本协议或任何适用法律的行为，我们有权在不另行通知的情况下暂停或终止服务、冻结并没收账户全部余额。',
        ),
        t(
          '因您的违规行为导致我们或第三方产生损失（包括但不限于合规罚款、法律费用、声誉损失）的，您应承担全部赔偿责任。',
        ),
        t(
          '平台可基于运维、安全、法律或商业调整的原因，在提前公告后变更、暂停或终止部分或全部功能。',
        ),
      ],
    },
    {
      id: 'disclaimer',
      title: t('免责声明与条款变更'),
      paragraphs: [
        t(
          '本服务按"现状"提供。在法律允许的最大范围内，我们不对服务的可用性、及时性、准确性、适用于特定目的做任何明示或默示保证。',
        ),
        t(
          '对上游模型输出的任何不准确、偏见、遗漏或幻觉（hallucination）内容，我们不承担直接或间接责任；您应在关键业务场景中自行核实结果。',
        ),
        t(
          '我们可能会不时更新本协议。重大变更将通过控制台通知、邮件或站内公告提前告知。继续使用服务即视为您接受更新后的条款。',
        ),
      ],
    },
    {
      id: 'contact',
      title: t('联系我们'),
      paragraphs: [
        t(
          '如对本协议、账户、违规举报或合规咨询有任何问题，请通过以下方式联系我们：',
        ),
      ],
      list: [
        t('服务与技术支持：support@aggretoken.com'),
        t('账单与支付相关：billing@aggretoken.com'),
        t('滥用举报与合规咨询：abuse@aggretoken.com'),
      ],
    },
  ];

  return (
    <LegalPage
      title={t('用户协议')}
      subtitle={t(
        '使用本服务前，请仔细阅读本协议。协议涵盖账户规则、多法域合规要求、用户责任与计费终止条款。',
      )}
      lastUpdated={t('最后更新：2026 年 4 月 23 日')}
      sections={sections}
    />
  );
};

export default UserAgreement;
