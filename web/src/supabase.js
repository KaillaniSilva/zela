import { createClient } from '@supabase/supabase-js';

// Mesmo projeto Supabase usado pelo app. A chave "publishable" é pública por
// design: quem protege os dados são as políticas RLS do supabase/schema.sql.
// Para usar outro projeto, defina as variáveis em web/.env (veja .env.example).
const DEMO_URL = 'https://zetiukcvyiyqfsomfksy.supabase.co';
const DEMO_KEY = 'sb_publishable_Wwj4ryCI1gGYqXvfK6IEAw_Ez7GsHXq';

const url = import.meta.env.VITE_SUPABASE_URL || DEMO_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEMO_KEY;

export const isConfigured = Boolean(url && anonKey);
export const supabase = createClient(url, anonKey);
