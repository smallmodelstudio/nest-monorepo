import { execSync } from 'node:child_process';

// Schematic tests load the compiled collection (and its copied templates) from dist/.
export default function setup(): void {
  execSync(
    'tsc -p tsconfig.build.json && node scripts/copy-schematic-assets.mjs',
    {
      stdio: 'inherit',
    },
  );
}
