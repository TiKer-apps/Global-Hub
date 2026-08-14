import { describe, expect, it } from 'vitest'
import { detectSource, parseIcs } from './ics-import'

const ICS_HEADER = (prodId: string) => `BEGIN:VCALENDAR\nPRODID:${prodId}\nVERSION:2.0\n`

describe('detectSource', () => {
  it('detects Google Calendar exports', () => {
    expect(detectSource(ICS_HEADER('-//Google Inc//Google Calendar 70.9054//EN'))).toBe('google')
  })

  it('detects Outlook/Microsoft exports', () => {
    expect(detectSource(ICS_HEADER('-//Microsoft Corporation//Outlook 16.0 MIMEDIR//EN'))).toBe('outlook')
  })

  it('falls back to local for anything else', () => {
    expect(detectSource(ICS_HEADER('-//Some Other App//EN'))).toBe('local')
  })
})

describe('parseIcs', () => {
  it('parses a simple timed event', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-1
SUMMARY:Réunion
DTSTART:20260810T090000
DTEND:20260810T100000
LOCATION:Salle A
DESCRIPTION:Point hebdo
END:VEVENT
END:VCALENDAR`

    const events = parseIcs(ics)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      title: 'Réunion',
      allDay: false,
      location: 'Salle A',
      description: 'Point hebdo',
      externalId: 'event-1',
    })
  })

  it('parses an all-day event (VALUE=DATE)', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-2
SUMMARY:Congé
DTSTART;VALUE=DATE:20260815
DTEND;VALUE=DATE:20260816
END:VEVENT
END:VCALENDAR`

    const [event] = parseIcs(ics)
    expect(event.allDay).toBe(true)
    expect(new Date(event.start).getDate()).toBe(15)
  })

  it('defaults a missing DTEND to +1h for a timed event', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-3
SUMMARY:Sans fin déclarée
DTSTART:20260810T140000
END:VEVENT
END:VCALENDAR`

    const [event] = parseIcs(ics)
    const start = new Date(event.start).getTime()
    const end = new Date(event.end).getTime()
    expect(end - start).toBe(60 * 60 * 1000)
  })

  it('defaults a missing SUMMARY to a placeholder title', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-4
DTSTART:20260810T140000
END:VEVENT
END:VCALENDAR`

    expect(parseIcs(ics)[0].title).toBe('(Sans titre)')
  })

  it('skips a recurring master event but keeps its explicit exceptions', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:series-1
SUMMARY:Série (master)
DTSTART:20260803T090000
RRULE:FREQ=WEEKLY
END:VEVENT
BEGIN:VEVENT
UID:series-1
RECURRENCE-ID:20260810T090000
SUMMARY:Série (occurrence modifiée)
DTSTART:20260810T110000
RRULE:FREQ=WEEKLY
END:VEVENT
END:VCALENDAR`

    const events = parseIcs(ics)
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Série (occurrence modifiée)')
  })

  it('ignores nested blocks such as VALARM', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-5
SUMMARY:Avec rappel
DTSTART:20260810T140000
BEGIN:VALARM
DESCRIPTION:This is an event reminder
END:VALARM
END:VEVENT
END:VCALENDAR`

    const [event] = parseIcs(ics)
    expect(event.description).toBeUndefined()
  })

  it('unfolds long lines continued on the next line (RFC 5545 line folding)', () => {
    const ics = `BEGIN:VCALENDAR
BEGIN:VEVENT
UID:event-6
SUMMARY:Titre replié\n sur deux lignes
DTSTART:20260810T140000
END:VEVENT
END:VCALENDAR`

    expect(parseIcs(ics)[0].title).toBe('Titre repliésur deux lignes')
  })
})
