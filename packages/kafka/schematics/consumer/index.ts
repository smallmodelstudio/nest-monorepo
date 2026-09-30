import type { Rule } from '@angular-devkit/schematics';
import { componentRule, type ComponentOptions } from '../utils/component.js';

export function main(options: ComponentOptions): Rule {
  return componentRule('consumer', options);
}
