import React, { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../lib/auth';
import concernsApi from '../api/concernsApi';
import apiClient from '../../../lib/api/apiClient';

const CATEGORY_OPTIONS = [
  { value: 'ATTENDANCE', label: 'Attendance & Timings' },
  { value: 'TIME_OFF', label: 'Time Off & Leave Balance' },
  { value: 'PAYROLL', label: 'Payroll & Payslip Deductions' },
  { value: 'CONTRACT', label: 'Employment Contract & Schedule' },
  { value: 'WORKPLACE', label: 'Workplace & Equipment' },
  { value: 'POLICY', label: 'HR Policy & Regulations' },
  { value: 'OTHER', label: 'General Concern' },
];

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low — General query' },
  { value: 'MEDIUM', label: 'Medium — Normal attention' },
  { value: 'HIGH', label: 'High — Urgent response needed' },
  { value: 'URGENT', label: 'Urgent — Blocking daily work' },
];

export default function RaiseConcernModal({
  isOpen,
  onClose,
  onSuccess,
  initialCategory = 'ATTENDANCE',
  initialSubject = '',
  initialDescription = '',
  initialPriority = 'MEDIUM',
  initialRelatedType = null,
  initialRelatedId = null,
  initialRelatedLabel = null,
  initialEmployeeId = null,
}) {
  const { user, role } = useAuth();
  const isEmployee = role === ROLES.EMPLOYEE;

  const [subject, setSubject] = useState(initialSubject);
  const [description, setDescription] = useState(initialDescription);
  const [category, setCategory] = useState(initialCategory);
  const [priority, setPriority] = useState(initialPriority);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId || '');
  const [employeesList, setEmployeesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSubject(initialSubject || '');
      setDescription(initialDescription || '');
      setCategory(initialCategory || 'ATTENDANCE');
      setPriority(initialPriority || 'MEDIUM');
      setSelectedEmployeeId(initialEmployeeId || (isEmployee ? user?.employeeId : ''));
      setError(null);

      // Load employees list for HR/management users
      if (!isEmployee) {
        apiClient
          .get('/employees?limit=100')
          .then((res) => {
            const list = res.data?.employees || res.data || [];
            setEmployeesList(list);
            if (!initialEmployeeId && list.length > 0 && !selectedEmployeeId) {
              setSelectedEmployeeId(list[0].id);
            }
          })
          .catch(() => {});
      }
    }
  }, [isOpen, initialSubject, initialDescription, initialCategory, initialPriority, initialEmployeeId, isEmployee, user?.employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Please provide a subject summary for your concern.');
      return;
    }
    if (!description.trim()) {
      setError('Please describe your concern in detail.');
      return;
    }
    if (!isEmployee && !selectedEmployeeId) {
      setError('Please select the employee regarding whom this concern is being raised.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
        subjectEmployeeId: isEmployee ? user.employeeId : selectedEmployeeId,
        relatedEntityType: initialRelatedType || null,
        relatedEntityId: initialRelatedId || null,
      };

      const res = await concernsApi.createConcern(payload);
      if (onSuccess) {
        onSuccess(res.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to submit concern. Please check inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employeesList.map((emp) => ({
    value: emp.id,
    label: `${emp.first_name} ${emp.last_name} (${emp.employee_code} • ${emp.department})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Raise a Concern"
      subtitle={isEmployee ? 'Submit a formal inquiry or issue to People & Culture / Payroll' : 'Initiate an authoritative concern or review regarding an employee'}
      maxWidth="620px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && <Alert type="error" message={error} />}

        {/* Linked Record Pill Context */}
        {initialRelatedType && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--primary-50, #eef2ff)',
              borderRadius: '8px',
              border: '1px solid var(--primary-200, #c7d2fe)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.8125rem',
              color: 'var(--primary-900, #312e81)',
            }}
          >
            <span style={{ fontWeight: 700 }}>Linked HR Context:</span>
            <span>{initialRelatedLabel || `${initialRelatedType} Record`}</span>
          </div>
        )}

        {/* Employee Selection (Only for HR / Management) */}
        {!isEmployee && (
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
              Regarding Employee <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            <Select
              id="concern_regarding_employee"
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              placeholder="Select Employee..."
              required
            />
          </div>
        )}

        {/* Category & Priority Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
              Category <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            <Select
              id="concern_category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
              Priority <span style={{ color: 'var(--danger-500)' }}>*</span>
            </label>
            <Select
              id="concern_priority"
              options={PRIORITY_OPTIONS}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Subject Input */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
            Subject / Headline <span style={{ color: 'var(--danger-500)' }}>*</span>
          </label>
          <Input
            id="concern_subject"
            type="text"
            placeholder="e.g. Attendance record mismatch for 4 September"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        {/* Description Textarea */}
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--neutral-700)', marginBottom: '6px' }}>
            Detailed Description <span style={{ color: 'var(--danger-500)' }}>*</span>
          </label>
          <Textarea
            id="concern_description"
            placeholder="Please detail what occurred, dates, affected amounts, or clarification requested..."
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--neutral-400)', marginTop: '4px' }}>
            All responses from HR will appear in your concern case timeline.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={loading} disabled={loading}>
            Submit Concern →
          </Button>
        </div>
      </form>
    </Modal>
  );
}
