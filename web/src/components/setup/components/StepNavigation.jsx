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
import { Button } from '@douyinfe/semi-ui';
import { CheckCircle } from 'lucide-react';

/**
 * 步骤导航组件 — macOS Setup Assistant footer
 */
const StepNavigation = ({
  currentStep,
  steps,
  prev,
  next,
  onSubmit,
  loading,
  t,
}) => {
  return (
    <div
      className='flex justify-between items-center mt-6 pt-4'
      style={{ borderTop: '1px solid var(--border-subtle)' }}
    >
      {/* Back button — ghost style */}
      {currentStep > 0 ? (
        <Button
          onClick={prev}
          className='!rounded-[var(--radius-md)]'
          style={{
            background: 'var(--surface-active)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
          }}
        >
          {t('上一步')}
        </Button>
      ) : (
        <div />
      )}

      {/* Next button — accent filled */}
      {currentStep < steps.length - 1 && (
        <Button
          type='primary'
          onClick={next}
          className='!rounded-[var(--radius-md)]'
          style={{
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
          }}
        >
          {t('下一步')}
        </Button>
      )}

      {/* Finish button — accent filled with icon */}
      {currentStep === steps.length - 1 && (
        <Button
          type='primary'
          onClick={onSubmit}
          loading={loading}
          className='!rounded-[var(--radius-md)]'
          icon={<CheckCircle size={16} />}
          style={{
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
          }}
        >
          {t('初始化系统')}
        </Button>
      )}
    </div>
  );
};

export default StepNavigation;
