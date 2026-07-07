import { supabase } from '../../lib/supabase'
import { MIX_STORAGE_KEY } from '../music/musicCatalog'
import {
  applyPresetVolumes,
  getMixPreset,
  saveMixPreset,
} from '../music/musicStore'

/** Returns the user's cloud preset, or null if they haven't saved one yet. */
export async function fetchRemotePreset(userId) {
  const { data, error } = await supabase
    .from('music_mix_presets')
    .select('preset')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }
  return data?.preset ?? null
}

export async function upsertRemotePreset(userId, preset) {
  const { error } = await supabase.from('music_mix_presets').upsert(
    {
      user_id: userId,
      preset,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    throw error
  }
}

/**
 * Called when the user clicks "Save Preset".
 * Local save always happens first so the app works offline; the cloud write
 * only runs when someone is signed in.
 * Returns 'synced' or 'local' so the UI can show what happened.
 */
export async function saveMixPresetEverywhere() {
  saveMixPreset()

  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user?.id
  if (!userId) {
    return 'local'
  }

  await upsertRemotePreset(userId, getMixPreset())
  return 'synced'
}

/**
 * Called after login (and on app start with an existing session).
 * Cloud preset wins if it exists; otherwise we upload the local preset once
 * so an existing device's mix becomes the cloud copy.
 */
export async function syncPresetOnLogin(userId) {
  const remotePreset = await fetchRemotePreset(userId)

  if (remotePreset) {
    applyPresetVolumes(remotePreset)
    return
  }

  const storedLocal = localStorage.getItem(MIX_STORAGE_KEY)
  if (!storedLocal) {
    return
  }

  try {
    await upsertRemotePreset(userId, JSON.parse(storedLocal))
  } catch {
    // A corrupt local preset just means nothing to migrate.
  }
}
