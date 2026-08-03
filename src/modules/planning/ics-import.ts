import { db } from '@/lib/db'
import type { EventSource } from './types'

interface ParsedIcsEvent {
  title: string
  start: string // ISO 8601
  end: string // ISO 8601
  allDay: boolean
  description?: string
  location?: string
  externalId: string
}

// Une ligne qui commence par une espace/tab est la suite de la précédente
// (RFC 5545 §3.1, "line folding") — sans ça une valeur un peu longue
// (SUMMARY, DESCRIPTION...) arrive tronquée à la première ligne repliée.
function unfoldLines(text: string): string[] {
  const rawLines = text.split(/\r\n|\n|\r/)
  const lines: string[] = []
  for (const line of rawLines) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
  }
  return lines
}

interface IcsLine {
  name: string
  params: Record<string, string>
  value: string
}

// `NAME;PARAM1=X;PARAM2=Y:valeur` — on coupe sur le premier ':' (les noms de
// propriété/paramètres n'en contiennent jamais, contrairement à la valeur
// qui peut en avoir, ex. une URL dans DESCRIPTION).
function parseLine(line: string): IcsLine | null {
  const colonIdx = line.indexOf(':')
  if (colonIdx === -1) return null
  const [name, ...paramParts] = line.slice(0, colonIdx).split(';')
  const params: Record<string, string> = {}
  for (const part of paramParts) {
    const eqIdx = part.indexOf('=')
    if (eqIdx === -1) continue
    params[part.slice(0, eqIdx).toUpperCase()] = part.slice(eqIdx + 1)
  }
  return { name: name.toUpperCase(), params, value: line.slice(colonIdx + 1) }
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\')
}

// `YYYYMMDD` (VALUE=DATE, journée entière), `YYYYMMDDTHHMMSSZ` (UTC) ou
// `YYYYMMDDTHHMMSS` (heure locale, avec ou sans TZID) — pour une app perso
// mono-utilisateur, une heure "locale" ou à TZID quelconque est traitée
// comme l'heure murale du fuseau du navigateur : hypothèse raisonnable tant
// que calendrier et appareil sont dans le même fuseau.
function parseIcsDate(value: string, params: Record<string, string>): { date: Date; allDay: boolean } {
  if (params.VALUE === 'DATE' || /^\d{8}$/.test(value)) {
    const y = Number(value.slice(0, 4))
    const mo = Number(value.slice(4, 6)) - 1
    const d = Number(value.slice(6, 8))
    return { date: new Date(y, mo, d), allDay: true }
  }
  const y = Number(value.slice(0, 4))
  const mo = Number(value.slice(4, 6)) - 1
  const d = Number(value.slice(6, 8))
  const h = Number(value.slice(9, 11))
  const mi = Number(value.slice(11, 13))
  const s = Number(value.slice(13, 15))
  if (value.endsWith('Z')) {
    return { date: new Date(Date.UTC(y, mo, d, h, mi, s)), allDay: false }
  }
  return { date: new Date(y, mo, d, h, mi, s), allDay: false }
}

function buildEvent(props: Record<string, IcsLine>): ParsedIcsEvent | null {
  // Série récurrente non déroulée (pas de gestion RRULE en v1, cf. types.ts)
  // : on saute le "master" pour ne garder que les occurrences concrètes déjà
  // détaillées dans le fichier (RECURRENCE-ID) — sinon le premier
  // enchaînement apparaît en double (une fois via le master, une fois via
  // son occurrence explicite).
  if ('RRULE' in props && !('RECURRENCE-ID' in props)) return null

  const dtstart = props.DTSTART
  if (!dtstart) return null
  const { date: start, allDay } = parseIcsDate(dtstart.value, dtstart.params)

  let end: Date
  if (props.DTEND) {
    end = parseIcsDate(props.DTEND.value, props.DTEND.params).date
  } else if (allDay) {
    end = new Date(start)
    end.setDate(end.getDate() + 1)
  } else {
    end = new Date(start.getTime() + 60 * 60 * 1000)
  }

  return {
    title: props.SUMMARY ? unescapeText(props.SUMMARY.value) : '(Sans titre)',
    start: start.toISOString(),
    end: end.toISOString(),
    allDay,
    description: props.DESCRIPTION ? unescapeText(props.DESCRIPTION.value) : undefined,
    location: props.LOCATION ? unescapeText(props.LOCATION.value) : undefined,
    externalId: props.UID?.value ?? crypto.randomUUID(),
  }
}

export function parseIcs(text: string): ParsedIcsEvent[] {
  const lines = unfoldLines(text)
  const events: ParsedIcsEvent[] = []
  let current: Record<string, IcsLine> | null = null
  // BEGIN:VALARM/VTIMEZONE etc. imbriqué dans un VEVENT : on ignore son
  // contenu (sinon ex. le DESCRIPTION générique d'une alarme "This is an
  // event reminder" écraserait celui, absent, de l'event lui-même).
  let subBlockDepth = 0

  for (const raw of lines) {
    const parsed = parseLine(raw)
    if (!parsed) continue

    if (parsed.name === 'BEGIN') {
      if (parsed.value === 'VEVENT') current = {}
      else if (current) subBlockDepth++
      continue
    }
    if (parsed.name === 'END') {
      if (parsed.value === 'VEVENT') {
        const event = current && buildEvent(current)
        if (event) events.push(event)
        current = null
        subBlockDepth = 0
      } else if (current && subBlockDepth > 0) {
        subBlockDepth--
      }
      continue
    }
    if (current && subBlockDepth === 0 && !(parsed.name in current)) {
      current[parsed.name] = parsed
    }
  }

  return events
}

export function detectSource(text: string): EventSource {
  const prodId = /^PRODID:.*/im.exec(text)?.[0] ?? ''
  if (/google/i.test(prodId)) return 'google'
  if (/microsoft/i.test(prodId)) return 'outlook'
  return 'local'
}

// Dédoublonne sur `externalId` : un ré-import du même fichier met à jour les
// events déjà connus plutôt que de les dupliquer.
export async function importIcsEvents(text: string): Promise<number> {
  const source = detectSource(text)
  const parsed = parseIcs(text)

  for (const event of parsed) {
    const existing = await db.events.where('externalId').equals(event.externalId).first()
    if (existing) {
      await db.events.update(existing.id, { ...event, source })
    } else {
      await db.events.add({ id: crypto.randomUUID(), ...event, source, important: false })
    }
  }

  return parsed.length
}
