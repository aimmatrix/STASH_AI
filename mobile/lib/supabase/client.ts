
import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Access env vars via Expo Constants or .env if configured. 
// For now, simpler to hardcode or use process.env provided by Expo (requires config).
// Better practice: create a .env file and use babel-plugin-dotenv-import or similar, 
// OR just paste the keys if this is a prototype.
// I will assume process.env.EXPO_PUBLIC_SUPABASE_URL standard in Expo Router v3+.

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
