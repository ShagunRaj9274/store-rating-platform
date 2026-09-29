import { StarShape } from '../../components/icons';

/** Two-panel frame for login/register. The left panel's star row fills in once on load. */
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="auth">
      <section className="auth__aside" aria-hidden="true">
        <div className="auth__brand">
          <StarShape size={22} className="brand__mark" /> Ratebook
        </div>
        <div className="auth__showcase">
          <div className="auth__stars">
            {[0, 1, 2, 3, 4].map((i) => (
              <StarShape key={i} size={56} style={{ '--i': i }} className={i < 4 ? 'is-on' : 'is-part'} />
            ))}
          </div>
          <p className="auth__figure">4.6</p>
          <p className="auth__line">Honest ratings for the stores you shop at, from people who shop there too.</p>
        </div>
        <p className="auth__foot">One login for shoppers, store owners and administrators.</p>
      </section>

      <section className="auth__main">
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
        </div>
      </section>
    </div>
  );
}
