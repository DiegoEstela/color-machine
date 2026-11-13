import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null si faltan las variables: la app sigue funcionando sin guardar en la nube.
export const supabase = url && anonKey ? createClient(url, anonKey) : null
