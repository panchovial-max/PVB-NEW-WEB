import { defineConfig } from '@trigger.dev/sdk/v3';

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF,
  machine: 'micro',
  build: {
    external: ['@anthropic-ai/sdk', '@supabase/supabase-js']
  }
});
