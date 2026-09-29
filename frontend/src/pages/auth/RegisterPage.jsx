import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell';
import FormField, { PasswordChecklist } from '../../components/FormField';
import { Alert } from '../../components/ui';
import { homeFor, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { LIMITS, rules, validate } from '../../utils/validation';

const SCHEMA = { name: rules.name, email: rules.email, address: rules.address, password: rules.password };

export default function RegisterPage() {
  const { user, register } = useAuth();
  const notify = useToast();
  const navigate = useNavigate();
  const [values, setValues] = useState({ name: '', email: '', address: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };
  // Validate a field when the user leaves it, not on every keystroke.
  const onBlur = (e) => {
    const { name } = e.target;
    if (values[name]) setErrors((er) => ({ ...er, [name]: SCHEMA[name](values[name]) }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, SCHEMA);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      const u = await register(values);
      notify('Account created. Welcome to Ratebook.');
      navigate(homeFor(u.role), { replace: true });
    } catch (err) {
      setFormError(getErrorMessage(err));
      setErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell title="Create an account" subtitle="Sign up to rate stores and keep track of your ratings.">
      <form onSubmit={onSubmit} noValidate className="stack">
        <Alert>{formError}</Alert>
        <FormField label="Full name" name="name" autoComplete="name" value={values.name}
          onChange={onChange} onBlur={onBlur} error={errors.name}
          hint={`Between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`} showCounter maxLength={LIMITS.nameMax} />
        <FormField label="Email" name="email" type="email" autoComplete="email" value={values.email}
          onChange={onChange} onBlur={onBlur} error={errors.email} />
        <FormField label="Address" name="address" as="textarea" autoComplete="street-address" value={values.address}
          onChange={onChange} onBlur={onBlur} error={errors.address} showCounter maxLength={LIMITS.addressMax} />
        <div>
          <FormField label="Password" name="password" type="password" autoComplete="new-password"
            value={values.password} onChange={onChange} error={errors.password} />
          <PasswordChecklist value={values.password} />
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="auth__switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </AuthShell>
  );
}
