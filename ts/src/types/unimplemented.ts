/** Throw until the named step is implemented. */
export function unimplemented(name: string): never {
  throw new Error(`gras_to_text: ${name} is not implemented`)
}
