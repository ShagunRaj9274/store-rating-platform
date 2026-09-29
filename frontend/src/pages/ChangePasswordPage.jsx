import { useState } from 'react';
import FormField, { PasswordChecklist } from '../components/FormField';
import { Alert, PageHeader } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api/services';
import { getErrorMessage, getFieldErrors } from '../api/client';
import { rules, validate } from '../utils/validation';

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' };

export default function ChangePasswordPage() {
  const notify = useToast();
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, {
      currentPassword: rules.required('Current password'),
      newPassword: (v, all) => rules.password(v) || (v === all.currentPassword ? 'New password must be different from the current one' : ''),
      confirmPassword: (v, all) => (v === all.newPassword ? '' : 'Passwords do not match'),
    });
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      await authApi.changePassword({ currentPassword: values.currentPassword, newPassword: values.newPassword });
      notify('Password updated');
      setValues(EMPTY);
    } catch (err) {
      setFormError(getErrorMessage(err));
      setErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Change password" description="You'll use the new password the next time you log in." />
      <form onSubmit={onSubmit} noValidate className="panel form-narrow stack">
        <Alert>{formError}</Alert>
        <FormField label="Current password" name="currentPassword" type="password" autoComplete="current-password"
          value={values.currentPassword} onChange={onChange} error={errors.currentPassword} />
        <div>
          <FormField label="New password" name="newPassword" type="password" autoComplete="new-password"
            value={values.newPassword} onChange={onChange} error={errors.newPassword} />
          <PasswordChecklist value={values.newPassword} />
        </div>
        <FormField label="Confirm new password" name="confirmPassword" type="password" autoComplete="new-password"
          value={values.confirmPassword} onChange={onChange} error={errors.confirmPassword} />
        <div>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </form>
    </>
  );
}
