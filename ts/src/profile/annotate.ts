/**
 * One pass of the English BERT tagger.
 * Sentence breaks come from our splitter. The model only tags the sentence it is given.
 */

import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { env, pipeline, type TokenClassificationPipeline } from '@huggingface/transformers'
import { splitSentences } from '../input/splitSentences.ts'
import type { AnnotatedSentence } from '../input/readInput.ts'
import { glueWordPieces } from './glueWordPieces.ts'

/** ONNX copy of vblagoje/bert-english-uncased-finetuned-pos. The original repo has no ONNX file. */
const MODEL = 'jdp8/bert-english-uncased-finetuned-pos'
const SKIP = new Set(['[CLS]', '[SEP]', '[PAD]'])

export function taggerCacheDir(): string {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), '../../.cache')
}

export function taggerCached(): boolean {
  const root = taggerCacheDir()
  if (!existsSync(root)) return false
  const pending = [root]
  while (pending.length > 0) {
    const dir = pending.pop()!
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.includes('bert-english-uncased-finetuned-pos')) return true
      if (entry.isDirectory()) pending.push(path.join(dir, entry.name))
    }
  }
  return false
}

let tagger: Promise<TokenClassificationPipeline> | null = null

function loadTagger(): Promise<TokenClassificationPipeline> {
  env.cacheDir = taggerCacheDir()
  if (!tagger) {
    tagger = pipeline('token-classification', MODEL, { cache_dir: taggerCacheDir() })
  }
  return tagger
}

function bareTag(entity: string): string {
  return entity.replace(/^[BI]-/, '')
}

export async function annotate(text: string): Promise<AnnotatedSentence[]> {
  const sentences = splitSentences(text)
  if (sentences.length === 0) return []
  const model = await loadTagger()
  const tagged: AnnotatedSentence[] = []
  for (const sentence of sentences) {
    const raw = await model(sentence, { aggregation_strategy: 'none' })
    const pieces = raw
      .filter((item) => item.word.length > 0 && !SKIP.has(item.word))
      .map((item) => ({ word: item.word, tag: bareTag(item.entity) }))
    const words = glueWordPieces(pieces)
    tagged.push({
      text: sentence,
      tags: words.map((word) => word.tag),
      words: words.map((word) => word.word),
    })
  }
  return tagged
}
