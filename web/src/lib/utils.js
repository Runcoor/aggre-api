/*
Copyright (C) 2025 QuantumNous

cn — concatenate class strings, dropping falsy values. Mirrors the
shadcn/ui utility used by Aceternity components. We don't include
tailwind-merge here since the project doesn't have it installed and
no current callers rely on the merge step.
*/

import clsx from 'clsx';

export const cn = (...inputs) => clsx(inputs);
