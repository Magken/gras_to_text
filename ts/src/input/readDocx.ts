/** Pull the words out of a Word file. Version 1 uses this for the docx input kind. */

export async function readDocx(data: Uint8Array): Promise<string> {
  if (data[0] !== 0x50 || data[1] !== 0x4b) throw new Error('gras_to_text: docx input is not a Word file')
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ buffer: Buffer.from(data) })
  return result.value
}
