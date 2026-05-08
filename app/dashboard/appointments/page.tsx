const appointments = [
  { time: "9:00 AM", title: "Home visit", owner: "Caregiver team" },
  { time: "11:30 AM", title: "Family check-in", owner: "Primary contact" },
  { time: "2:00 PM", title: "Medication review", owner: "Clinical staff" }
];

export default function AppointmentsPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Appointments</h2>
        <button className="button primary">Schedule</button>
      </div>
      <section className="timeline">
        {appointments.map((appointment) => (
          <article className="timeline-item" key={appointment.time}>
            <time>{appointment.time}</time>
            <div>
              <strong>{appointment.title}</strong>
              <span>{appointment.owner}</span>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
