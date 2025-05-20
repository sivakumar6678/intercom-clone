export default function CustomerInfo({ chat }) {
  if (!chat) return null;

  const { user } = chat;

  return (
    <div className="card mt-3">
      <div className="card-body">
        <h5>{user.name}</h5>
        <p>Email: {user.email}</p>
        <p>Device: {user.device}</p>
      </div>
    </div>
  );
}
