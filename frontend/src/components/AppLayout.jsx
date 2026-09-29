import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/format';
import { IconGrid, IconUsers, IconStore, IconKey, IconLogout, StarShape } from './icons';

const NAV = {
  ADMIN: [
    { to: '/admin', label: 'Overview', icon: IconGrid, end: true },
    { to: '/admin/users', label: 'Users', icon: IconUsers },
    { to: '/admin/stores', label: 'Stores', icon: IconStore },
  ],
  USER: [{ to: '/stores', label: 'Stores', icon: IconStore }],
  OWNER: [{ to: '/owner', label: 'My store', icon: IconGrid }],
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className="sidebar">
        <div className="brand">
          <StarShape size={22} className="brand__mark" />
          <span className="brand__name">Ratebook</span>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV[user.role].map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav__link">
              <Icon /> <span>{label}</span>
            </NavLink>
          ))}
          <NavLink to="/account/password" className="nav__link">
            <IconKey /> <span>Password</span>
          </NavLink>
        </nav>

        <div className="sidebar__user">
          <div className="sidebar__who">
            <span className="sidebar__name" title={user.name}>{user.name}</span>
            <span className="sidebar__role">{ROLE_LABELS[user.role]}</span>
          </div>
          <button type="button" className="nav__link nav__logout" onClick={onLogout}>
            <IconLogout /> <span>Log out</span>
          </button>
        </div>
      </aside>

      <main id="main" className="main">
        <Outlet />
      </main>
    </div>
  );
}
