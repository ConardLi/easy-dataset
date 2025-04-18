import { atomWithStorage } from 'jotai/utils';
import { useAtom } from 'jotai';

// 模型配置列表
export const modelConfigListAtom = atomWithStorage('modelConfigList', []);
export const selectedModelInfoAtom = atomWithStorage('selectedModelInfo', {});
