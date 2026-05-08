const families = [
  { name: "Evelyn Marshall", status: "Planning", plan: "Memorial service" },
  { name: "Raymond Harris", status: "Confirmed", plan: "Visitation and service" },
  { name: "Linda Chen", status: "New family", plan: "Arrangement conference" }
];

export default function FamiliesPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Families</h2>
        <button className="button primary">Add family</button>
      </div>
      <section className="table-panel">
        {families.map((family) => (
          <article className="table-row" key={family.name}>
            <div>
              <strong>{family.name}</strong>
              <span>{family.plan}</span>
            </div>
            <span className="status-pill">{family.status}</span>
          </article>
        ))}
      </section>
    </div>
  );
}
