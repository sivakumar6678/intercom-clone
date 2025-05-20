export default function Sidebar() {
  return (
    <div className="d-flex flex-column bg-light p-3" style={{ height: '100vh' }}>
      <h5 className="mb-4">Admin Panel</h5>
      <a href="#" className="mb-2 text-decoration-none text-dark">Inbox</a>
      <a href="#" className="mb-2 text-decoration-none text-dark">Reports</a>
      <a href="#" className="mb-2 text-decoration-none text-dark">Automation</a>
      <a href="#" className="mb-2 text-decoration-none text-dark">Settings</a>
    </div>
  );
}
