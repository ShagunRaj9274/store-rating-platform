import { useState } from 'react';
import Modal from '../../components/Modal';
import FormField, { PasswordChecklist } from '../../components/FormField';
import { Alert } from '../../components/ui';
import { adminApi } from '../../api/services';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LIMITS, rules, validate } from '../../utils/validation';

const SCHEMA = { name: rules.name, email: rules.email, address: rules.address, password: rules.password };

export default function CreateUserModal({ onClose, onCreated }) {
  const notify = useToast();
  const [values, setValues] = useState({ name: '', email: '', address: '', password: '', role: 'USER' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: '' }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const found = validate(values, SCHEMA);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setFormError('');
    try {
      const created = await adminApi.createUser(values);
      notify(`${created.name} added`);
      onCreated();
      onClose();
    } catch (err) {
      setFormError(getErrorMessage(err));
      setErrors(getFieldErrors(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Add user"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-user" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add user'}
          </button>
        </>
      }
    >
      <form id="create-user" onSubmit={onSubmit} noValidate className="stack">
        <Alert>{formError}</Alert>
        <FormField label="Role" name="role" as="select" value={values.role} onChange={onChange} error={errors.role}>
          <option value="USER">Normal user</option>
          <option value="OWNER">Store owner</option>
          <option value="ADMIN">Admin</option>
        </FormField>
        <FormField label="Full name" name="name" value={values.name} onChange={onChange} error={errors.name}
          showCounter maxLength={LIMITS.nameMax} hint={`Between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`} />
        <FormField label="Email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} />
        <FormField label="Address" name="address" as="textarea" value={values.address} onChange={onChange}
          error={errors.address} showCounter maxLength={LIMITS.addressMax} />
        <div>
          <FormField label="Temporary password" name="password" type="password" autoComplete="new-password"
            value={values.password} onChange={onChange} error={errors.password} />
          <PasswordChecklist value={values.password} />
        </div>
      </form>
    </Modal>
  );
}
