import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Projeto Supabase da demonstração. A chave "publishable" é pública por design:
// quem protege os dados são as políticas RLS do supabase/schema.sql.
// Para usar outro projeto, defina as variáveis em app/.env (veja .env.example).
const DEMO_URL = 'https://zetiukcvyiyqfsomfksy.supabase.co';
const DEMO_KEY = 'sb_publishable_Wwj4ryCI1gGYqXvfK6IEAw_Ez7GsHXq';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL || DEMO_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEMO_KEY;

export const isConfigured = Boolean(url && anonKey);

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
