export default function SettingsPage() {
  return (
    <div className="page-stack">
      <div className="section-heading">
        <h2>Settings</h2>
      </div>
      <section className="panel">
        <form className="settings-form">
          <label>
            Organization name
            <input defaultValue="Marshall Family Care" />
          </label>
          <label>
            Support email
            <input type="email" placeholder="support@example.com" />
          </label>
          <label>
            Default role
            <select defaultValue="family">
              <option value="family">Family member</option>
              <option value="staff">Staff</option>
              <option value="service_director">Service director</option>
              <option value="admin">Admin</option>
            </select>
          </label>
          <button className="button primary" type="button">
            Save settings
          </button>
        </form>
      </section>
    </div>
  );
}
