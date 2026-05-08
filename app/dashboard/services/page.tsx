const appointments = [
  { time: "9:00 AM", title: "Arrangement conference", owner: "Service director" },
  { time: "11:30 AM", title: "Family check-in", owner: "Primary contact" },
  { time: "2:00 PM", title: "Obituary review", owner: "Family support staff" }
];

export default function AppointmentsPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Services</h2>
        <button className="button primary">Schedule service</button>
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
