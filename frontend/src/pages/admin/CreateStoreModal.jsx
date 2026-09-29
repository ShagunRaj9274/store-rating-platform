import { useEffect, useState } from 'react';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { Alert } from '../../components/ui';
import { adminApi } from '../../api/services';
import { getErrorMessage, getFieldErrors } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { LIMITS, rules, validate } from '../../utils/validation';

const SCHEMA = { name: rules.name, email: rules.email, address: rules.address };

export default function CreateStoreModal({ onClose, onCreated }) {
  const notify = useToast();
  const [values, setValues] = useState({ name: '', email: '', address: '', ownerId: '' });
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminApi.availableOwners().then(setOwners).catch(() => setOwners([]));
  }, []);

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
      const created = await adminApi.createStore({ ...values, ownerId: values.ownerId ? Number(values.ownerId) : null });
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
      title="Add store"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="create-store" className="btn btn--primary" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add store'}
          </button>
        </>
      }
    >
      <form id="create-store" onSubmit={onSubmit} noValidate className="stack">
        <Alert>{formError}</Alert>
        <FormField label="Store name" name="name" value={values.name} onChange={onChange} error={errors.name}
          showCounter maxLength={LIMITS.nameMax} hint={`Between ${LIMITS.nameMin} and ${LIMITS.nameMax} characters`} />
        <FormField label="Store email" name="email" type="email" value={values.email} onChange={onChange} error={errors.email} />
        <FormField label="Address" name="address" as="textarea" value={values.address} onChange={onChange}
          error={errors.address} showCounter maxLength={LIMITS.addressMax} />
        <FormField label="Owner" name="ownerId" as="select" value={values.ownerId} onChange={onChange} error={errors.ownerId}
          hint={owners.length ? 'Only store owners without a store are listed.' : 'No free store owners. Add a user with the Store owner role first, or leave this unassigned.'}>
          <option value="">No owner yet</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.name} ({o.email})</option>)}
        </FormField>
      </form>
    </Modal>
  );
}
