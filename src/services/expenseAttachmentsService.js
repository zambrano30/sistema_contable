import { isSupabaseConfigured, supabase } from '../lib/supabaseClient'

/**
 * Get attachments for an expense
 */
export async function getExpenseAttachments(expenseId) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase
      .from('expense_attachments')
      .select(`
        *,
        uploaded_by:uploaded_by(email, raw_user_meta_data)
      `)
      .eq('expense_id', expenseId)
      .order('uploaded_at', { ascending: false })

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data || [] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Upload a file to expense
 */
export async function uploadExpenseAttachment(expenseId, file) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const user = await supabase.auth.getUser()
    const fileName = `${Date.now()}-${file.name}`
    const filePath = `expenses/${expenseId}/${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('expense-documents')
      .upload(filePath, file)

    if (uploadError) return { ok: false, error: uploadError.message }

    // Create record in database
    const { data, error: dbError } = await supabase
      .from('expense_attachments')
      .insert([{
        expense_id: expenseId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        uploaded_by: user.data.user?.id
      }])
      .select()

    if (dbError) return { ok: false, error: dbError.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Delete an attachment
 */
export async function deleteExpenseAttachment(attachmentId, filePath) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('expense-documents')
      .remove([filePath])

    if (storageError) return { ok: false, error: storageError.message }

    // Delete database record
    const { error: dbError } = await supabase
      .from('expense_attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) return { ok: false, error: dbError.message }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Get download URL for attachment
 */
export async function getAttachmentDownloadUrl(filePath) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase.storage
      .from('expense-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) return { ok: false, error: error.message }
    return { ok: true, url: data.signedUrl }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}

/**
 * Mark attachment as verified
 */
export async function verifyAttachment(attachmentId) {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, error: 'Missing Supabase configuration' }
  }

  try {
    const { data, error } = await supabase
      .from('expense_attachments')
      .update({ is_verified: true })
      .eq('id', attachmentId)
      .select()

    if (error) return { ok: false, error: error.message }
    return { ok: true, data: data[0] }
  } catch (err) {
    return { ok: false, error: err.message }
  }
}
