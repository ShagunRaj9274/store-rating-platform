import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="full-center not-found">
      <p className="not-found__code">404</p>
      <h1>This page doesn&apos;t exist</h1>
      <p>The link may be old or mistyped.</p>
      <Link to="/" className="btn btn--primary">Go to your home page</Link>
    </div>
  );
}
