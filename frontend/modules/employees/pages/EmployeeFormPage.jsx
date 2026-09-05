import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import Textarea from '../../../components/ui/Textarea';
import FormSection from '../../../components/forms/FormSection';
import FormActions from '../../../components/forms/FormActions';
import Alert from '../../../components/feedback/Alert';
import Loading from '../../../components/feedback/Loading';
import employeesApi from '../api/employeesApi';
import { useEmployee } from '../hooks/useEmployee';

/**
 * Employee Form Page (Create / Edit)
 * Owner: P1 (Core HR)
 */
export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { employee, loading: loadingInitial } = useEmployee(id);

  const [formData, setFormData] = useState({
    employee_code: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    date_of_joining: new Date().toISOString().split('T')[0],
    date_of_birth: '',
    gender: 'Other',
    national_id: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    status: 'ACTIVE',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && employee) {
      setFormData({
        employee_code: employee.employee_code || `EMP-${employee.id || ''}`,
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || 'Engineering',
        designation: employee.designation || employee.role || '',
        date_of_joining: employee.date_of_joining ? employee.date_of_joining.split('T')[0] : '',
        date_of_birth: employee.date_of_birth ? employee.date_of_birth.split('T')[0] : '',
        gender: employee.gender || 'Other',
        national_id: employee.national_id || '',
        address: employee.address || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_contact_phone: employee.emergency_contact_phone || '',
        status: employee.status || 'ACTIVE',
      });
    }
  }, [isEditMode, employee]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.first_name?.trim()) errs.first_name = 'First name is required';
    if (!formData.last_name?.trim()) errs.last_name = 'Last name is required';
    if (!formData.email?.trim()) {
      errs.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.employee_code?.trim()) errs.employee_code = 'Employee code is required';
    if (!formData.date_of_joining) errs.date_of_joining = 'Date of joining is required';
    if (!formData.status) errs.status = 'Status is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setApiError(null);
    setSuccessMessage(null);

    if (!validate()) return;

    setSubmitting(true);
    try {
      if (isEditMode) {
        await employeesApi.updateEmployee(id, formData);
        setSuccessMessage('Employee profile updated successfully!');
      } else {
        await employeesApi.createEmployee(formData);
        setSuccessMessage('New employee onboarded successfully!');
      }
      setTimeout(() => {
        navigate('/employees');
      }, 800);
    } catch (err) {
      const detailsMsg = Array.isArray(err.details) && err.details.length > 0 ? `: ${err.details.join(', ')}` : '';
      setApiError((err.message || 'Failed to save employee. Please try again.') + detailsMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditMode && loadingInitial) {
    return (
      <PageContainer title="Edit Employee">
        <Loading message="Loading employee record..." />
      </PageContainer>
    );
  }

  const departmentOptions = [
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Human Resources', label: 'Human Resources' },
    { value: 'Finance', label: 'Finance' },
    { value: 'Operations', label: 'Operations' },
    { value: 'Marketing', label: 'Marketing' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Customer Success', label: 'Customer Success' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'INACTIVE', label: 'Inactive' },
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' },
  ];

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/employees" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Employees
          </Link>
          <span>/</span>
          <span>{isEditMode ? 'Edit Employee' : 'Onboard New Employee'}</span>
        </div>
      }
      title={isEditMode ? 'Edit Employee Profile' : 'Onboard New Employee'}
      subtitle="Register official workforce master records into PeoplePay360"
    >
      {apiError && (
        <Alert type="danger" title="Submission Error">
          {apiError}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Personal Information */}
        <FormSection
          title="Personal Details"
          description="Basic personal identification details according to official documents"
          columns={2}
        >
          <Input
            label="First Name"
            id="first_name"
            required
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            error={errors.first_name}
            placeholder="e.g. Alex"
          />

          <Input
            label="Last Name"
            id="last_name"
            required
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            error={errors.last_name}
            placeholder="e.g. Morgan"
          />

          <Input
            label="Employee Code"
            id="employee_code"
            required
            value={formData.employee_code}
            onChange={(e) => handleChange('employee_code', e.target.value)}
            error={errors.employee_code}
            placeholder="e.g. EMP-1001"
            helperText="Unique workforce identifier"
          />

          <Select
            label="Gender"
            id="gender"
            options={genderOptions}
            value={formData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
          />

          <DatePicker
            label="Date of Birth"
            id="date_of_birth"
            value={formData.date_of_birth}
            onChange={(e) => handleChange('date_of_birth', e.target.value)}
          />

          <Input
            label="National / Tax ID"
            id="national_id"
            value={formData.national_id}
            onChange={(e) => handleChange('national_id', e.target.value)}
            placeholder="e.g. SSN or National ID"
          />
        </FormSection>

        {/* Section 2: Employment Information */}
        <FormSection
          title="Employment & Role Assignment"
          description="Organizational placement, joining timeline, and working status"
          columns={2}
        >
          <Select
            label="Department"
            id="department"
            required
            options={departmentOptions}
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
          />

          <Input
            label="Designation / Job Role"
            id="designation"
            required
            value={formData.designation}
            onChange={(e) => handleChange('designation', e.target.value)}
            placeholder="e.g. Senior Software Engineer"
          />

          <DatePicker
            label="Date of Joining"
            id="date_of_joining"
            required
            value={formData.date_of_joining}
            onChange={(e) => handleChange('date_of_joining', e.target.value)}
            error={errors.date_of_joining}
          />

          <Select
            label="Employment Status"
            id="status"
            required
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            error={errors.status}
          />
        </FormSection>

        {/* Section 3: Contact Details */}
        <FormSection
          title="Contact & Location Information"
          description="Communication channels and emergency contact details"
          columns={2}
        >
          <Input
            label="Work Email"
            id="email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="e.g. alex.morgan@company.com"
          />

          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="e.g. +1 (555) 019-2834"
          />

          <Input
            label="Emergency Contact Name"
            id="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
            placeholder="e.g. Sarah Morgan (Spouse)"
          />

          <Input
            label="Emergency Contact Phone"
            id="emergency_contact_phone"
            type="tel"
            value={formData.emergency_contact_phone}
            onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
            placeholder="e.g. +1 (555) 019-2835"
          />

          <div style={{ gridColumn: '1 / -1' }}>
            <Textarea
              label="Residential Address"
              id="address"
              rows={2}
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Street address, city, state, postal code"
            />
          </div>
        </FormSection>

        {/* Actions */}
        <FormActions
          onCancel={() => navigate('/employees')}
          submitLabel={isEditMode ? 'Update Employee' : 'Onboard Employee'}
          loading={submitting}
        />
      </form>
    </PageContainer>
  );
}
