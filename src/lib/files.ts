import path from "path";
import { randomUUID } from "crypto";
import { getSupabase, JUSTIFICATIONS_BUCKET } from "./supabase";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["application/pdf", "image/jpeg", "image/jpg"]);
const ALLOWED_EXT = new Set([".pdf", ".jpg", ".jpeg"]);

export function validateJustificationFile(file: File): string | null {
  if (file.size > MAX_FILE_SIZE) {
    return "Le fichier ne doit pas dépasser 5 Mo";
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext) && !ALLOWED_MIME.has(file.type)) {
    return "Format accepté : PDF ou JPG uniquement";
  }

  return null;
}

export async function saveJustificationFile(file: File): Promise<string> {
  const supabase = getSupabase();
  const ext = path.extname(file.name).toLowerCase();
  const safeExt = ALLOWED_EXT.has(ext)
    ? ext
    : file.type === "application/pdf"
      ? ".pdf"
      : ".jpg";
  const filename = `${randomUUID()}${safeExt}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(JUSTIFICATIONS_BUCKET)
    .upload(filename, buffer, {
      contentType: file.type || getMimeType(filename),
      upsert: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return filename;
}

export async function deleteJustificationFile(
  filename: string | null | undefined
): Promise<void> {
  if (!filename) return;
  const supabase = getSupabase();
  await supabase.storage.from(JUSTIFICATIONS_BUCKET).remove([filename]);
}

export async function deleteJustificationFiles(filenames: string[]): Promise<void> {
  if (!filenames.length) return;
  const supabase = getSupabase();
  await supabase.storage.from(JUSTIFICATIONS_BUCKET).remove(filenames);
}

export async function getJustificationBytes(
  filename: string
): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase.storage
    .from(JUSTIFICATIONS_BUCKET)
    .download(filename);

  if (error || !data) return null;

  return {
    data: await data.arrayBuffer(),
    contentType: getMimeType(filename),
  };
}

export function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  if (ext === ".pdf") return "application/pdf";
  return "image/jpeg";
}
