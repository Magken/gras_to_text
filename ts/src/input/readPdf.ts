/** Pull the words out of a PDF. Version 1 uses this for the pdf input kind. */

export async function readPdf(data: Uint8Array): Promise<string> {
  const head = Buffer.from(data.subarray(0, 5)).toString('ascii')
  if (head !== '%PDF-') throw new Error('gras_to_text: pdf input is not a PDF')
  const { extractText, getDocumentProxy } = await import('unpdf')
  const pdf = await getDocumentProxy(data)
  const extracted = await extractText(pdf, { mergePages: true })
  const text = extracted.text
  return Array.isArray(text) ? text.join('\n\n') : text
}
