const messages = [
  "Transportation confirmed for the Friday appointment.",
  "Updated care plan notes are ready for review.",
  "A family contact requested a medication schedule copy."
];

export default function MessagesPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Messages</h2>
        <button className="button primary">New message</button>
      </div>
      <section className="message-list">
        {messages.map((message) => (
          <article className="message-card" key={message}>
            <p>{message}</p>
            <span>Needs review</span>
          </article>
        ))}
      </section>
    </div>
  );
}
