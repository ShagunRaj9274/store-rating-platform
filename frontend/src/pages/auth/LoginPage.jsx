import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import FormField from '../../components/FormField';
import { Alert } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { rules, validate } from '../../utils/validation';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@storerating.com', password: 'Admin@123' },
  { label: 'Store owner', email: 'owner1@storerating.com', password: 'Owner@123' },
  { label: 'Normal user', email: 'user1@storerating.com', password: 'User@1234' },
];
const showDemo = import.meta.env.VITE_SHOW_DEMO !== 'false';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, { email: rules.email, password: rules.required('Password') });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      const u = await login(values);
      navigate(location.state?.from ?? homeFor(u.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Log in" subtitle="Use the email and password for your account.">
      <form onSubmit={onSubmit} noValidate className="stack">
        <Alert>{formError}</Alert>
        <FormField label="Email" name="email" type="email" autoComplete="email"
          value={values.email} onChange={onChange} error={errors.email} />
        <FormField label="Password" name="password" type="password" autoComplete="current-password"
          value={values.password} onChange={onChange} error={errors.password} />
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="auth__switch">
        New here? <Link to="/register">Create an account</Link>
      </p>

      {showDemo && (
        <div className="demo">
          <p className="demo__label">Try a demo account</p>
          <div className="demo__buttons">
            {DEMO_ACCOUNTS.map((a) => (
              <button key={a.label} type="button" className="btn btn--ghost btn--sm"
                onClick={() => { setValues({ email: a.email, password: a.password }); setErrors({}); setFormError(''); }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthShell>
  );
}
