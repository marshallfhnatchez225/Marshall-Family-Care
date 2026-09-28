import Link from 'next/link';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ActionForm } from './action-form';
import { saveCalendarEntry } from '@/app/calendar-actions';
import { gridDates, shiftMonth, timeLabel, type CalendarItem, type CalendarKind, type CalendarStatus } from '@/lib/home-calendar';

type CaseOption = { id: string; name: string };
const kinds: { value: CalendarKind; label: string }[] = [
  { value: 'arrangement', label: 'Arrangement' },
  { value: 'funeral', label: 'Funeral' },
  { value: 'wake', label: 'Wake' },
  { value: 'visitation', label: 'Visitation' },
  { value: 'preneed', label: 'Preneed appointment' },
  { value: 'other', label: 'Other' },
];
const statuses: { value: CalendarStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'tentative', label: 'Tentative' },
  { value: 'cancelled', label: 'Cancelled' },
];
const sourceLabel: Record<CalendarItem['source'], string> = {
  manual: 'Staff entry', google_voice_group: 'Marshall group',
  case_appointment: 'Case appointment', arrangement_sheet: 'Arrangement sheet',
};
const weekdayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

function Editor({ item, cases, defaultDate }: { item?: CalendarItem; cases: CaseOption[]; defaultDate: string }) {
  return <ActionForm action={saveCalendarEntry} submit={item ? 'Save changes' : 'Add to calendar'} className="calendar-form">
    {item && <input type="hidden" name="id" value={item.id}/>}
    <div className="calendar-form-grid">
      <label>What is happening?<input name="title" required minLength={2} maxLength={200} defaultValue={item?.title ?? ''} placeholder="Family meeting, wake, funeral…"/></label>
      <label>Type<select name="kind" defaultValue={item?.kind ?? 'arrangement'}>{kinds.map(kind => <option value={kind.value} key={kind.value}>{kind.label}</option>)}</select></label>
      <label>Date<input name="event_date" type="date" required defaultValue={item?.date ?? defaultDate}/></label>
      <label>Start time <small>optional</small><input name="start_time" type="time" defaultValue={item?.time ?? ''}/></label>
      <label>End time <small>optional</small><input name="end_time" type="time" defaultValue={item?.endTime ?? ''}/></label>
      <label>Status<select name="status" defaultValue={item?.status ?? 'confirmed'}>{statuses.map(status => <option value={status.value} key={status.value}>{status.label}</option>)}</select></label>
      {!item && <label>Information source<select name="source" defaultValue="manual"><option value="manual">Staff entry</option><option value="google_voice_group">Marshall group text</option></select></label>}
      <label>Place<input name="location" maxLength={200} defaultValue={item?.location ?? ''} placeholder="Office, church, family home…"/></label>
      <label>Staff<input name="staff" maxLength={150} defaultValue={item?.staff ?? ''} placeholder="Who is handling it?"/></label>
      <label>Related case<select name="case_id" defaultValue={item?.caseId ?? ''}><option value="">No case yet</option>{cases.map(c => <option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
      <label className="calendar-form-notes">Notes<textarea name="notes" rows={2} maxLength={2000} defaultValue={item?.notes ?? ''} placeholder="Details to confirm, source, preparation…"/></label>
    </div>
  </ActionForm>;
}

export function HomeCalendar({ month, today, items, cases, loadingError }: { month: string; today: string; items: CalendarItem[]; cases: CaseOption[]; loadingError?: boolean }) {
  const dates = gridDates(month);
  const byDate = new Map<string, CalendarItem[]>();
  for (const item of items) {
    const dateItems = byDate.get(item.date) ?? [];
    dateItems.push(item);
    byDate.set(item.date, dateItems);
  }
  for (const dateItems of byDate.values()) dateItems.sort((a, b) => (a.time ?? '99:99').localeCompare(b.time ?? '99:99') || a.title.localeCompare(b.title));
  const monthName = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
  const monthItems = items.filter(item => item.date.startsWith(month) && item.status !== 'cancelled');
  const defaultDate = today.startsWith(month) ? today : `${month}-01`;
  return <section className="home-calendar panel" aria-label="Marshall operations calendar">
    <div className="calendar-header">
      <div><p className="eyebrow"><CalendarDays size={15}/> Marshall schedule</p><h2>Calendar</h2><p>Arrangements, funerals, wakes, visitations, and preneed meetings in one place.</p></div>
      <div className="calendar-navigation"><Link href={`/?month=${shiftMonth(month, -1)}#calendar`} aria-label="Previous month"><ChevronLeft size={19}/></Link><strong>{monthName}</strong><Link href={`/?month=${shiftMonth(month, 1)}#calendar`} aria-label="Next month"><ChevronRight size={19}/></Link><Link className="calendar-today" href="/#calendar">Today</Link></div>
    </div>
    <div className="calendar-tools"><span>{monthItems.length} {monthItems.length === 1 ? 'item' : 'items'} this month</span><span>Case dates update from arrangements · Marshall group entries can be reviewed below</span></div>
    {loadingError && <p className="formerror">The calendar could not load all saved entries. Refresh or check the database setup.</p>}
    <details className="calendar-compose"><summary><Plus size={16}/> Add an arrangement, service, or appointment</summary><Editor cases={cases} defaultDate={defaultDate}/></details>
    <div className="calendar-scroll" id="calendar"><div className="calendar-grid">
      {weekdayNames.map(day => <div className="calendar-weekday" key={day}>{day}</div>)}
      {dates.map(date => <div className={`calendar-day${date.startsWith(month) ? '' : ' outside'}${date === today ? ' today' : ''}`} key={date}>
        <div className="calendar-day-head"><span>{Number(date.slice(-2))}</span>{date === today && <small>Today</small>}</div>
        <div className="calendar-day-events">{(byDate.get(date) ?? []).filter(item => item.status !== 'cancelled').map(item => <details className={`calendar-event ${item.kind}${item.status === 'tentative' ? ' tentative' : ''}`} key={item.id}>
          <summary><span>{timeLabel(item.time)}</span><strong>{item.title}</strong></summary>
          <div className="calendar-event-detail"><p><b>{sourceLabel[item.source]}</b> · {item.status}</p>{item.location && <p>Place: {item.location}</p>}{item.staff && <p>Staff: {item.staff}</p>}{item.notes && <p>{item.notes}</p>}
            {item.caseId && <Link className="link" href={`/cases/${item.caseId}`}>Open case →</Link>}
            {['manual','google_voice_group'].includes(item.source) ? <Editor item={item} cases={cases} defaultDate={date}/> : <p>Update this date in the case arrangement.</p>}
          </div>
        </details>)}</div>
      </div>)}
    </div></div>
    <div className="calendar-legend"><span><i className="arrangement"/>Arrangement</span><span><i className="funeral"/>Funeral</span><span><i className="wake"/>Wake / visitation</span><span><i className="preneed"/>Preneed</span><span><i className="tentative"/>Tentative</span></div>
  </section>;
}
