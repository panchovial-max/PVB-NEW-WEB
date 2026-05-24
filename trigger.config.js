import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: 'proj_qedtnsmmqxjnmoagqlkl',
  machine: 'micro',
  maxDuration: 300,
  build: {
    external: ['@anthropic-ai/sdk', '@supabase/supabase-js']
  }
});
