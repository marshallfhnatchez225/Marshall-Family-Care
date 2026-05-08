const patients = [
  { name: "Evelyn Marshall", status: "Stable", plan: "Home care" },
  { name: "Raymond Harris", status: "Follow-up", plan: "Medication review" },
  { name: "Linda Chen", status: "New intake", plan: "Assessment" }
];

export default function PatientsPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Patients</h2>
        <button className="button primary">Add patient</button>
      </div>
      <section className="table-panel">
        {patients.map((patient) => (
          <article className="table-row" key={patient.name}>
            <div>
              <strong>{patient.name}</strong>
              <span>{patient.plan}</span>
            </div>
            <span className="status-pill">{patient.status}</span>
          </article>
        ))}
      </section>
    </div>
  );
}
