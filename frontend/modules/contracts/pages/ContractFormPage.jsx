import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import FormSection from '../../../components/forms/FormSection';
import FormActions from '../../../components/forms/FormActions';
import Alert from '../../../components/feedback/Alert';
import Loading from '../../../components/feedback/Loading';
import contractsApi from '../api/contractsApi';
import { useContract } from '../hooks/useContract';
import employeesApi from '../../employees/api/employeesApi';
import schedulesApi from '../../schedules/api/schedulesApi';

/**
 * Contract Form Page (Create / Edit)
 * Owner: P1 (Core HR)
 */
export default function ContractFormPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const queryEmployeeId = searchParams.get('employee_id');

  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { contract, loading: loadingInitial } = useContract(id);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);

  const [formData, setFormData] = useState({
    employee_id: queryEmployeeId || '',
    contract_type: 'Permanent Full-Time',
    wage_rate: '',
    wage_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    working_schedule_id: '',
    status: 'ACTIVE',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch employees list for selector
  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await employeesApi.getEmployees({ limit: 200 });
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

        const opts = items.map((emp) => ({
          value: String(emp.id),
          label: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name || `Employee #${emp.id}`,
        }));
        setEmployeeOptions(opts);
      } catch {
        setEmployeeOptions([]);
      }
    }
    loadEmployees();
  }, []);

  // Fetch working schedules list for selector
  useEffect(() => {
    async function loadSchedules() {
      try {
        const response = await schedulesApi.getSchedules({ limit: 100 });
        const items = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.data?.items)
          ? response.data.items
          : [];

        if (items.length > 0) {
          const opts = items.map((s) => ({
            value: String(s.id),
            label: `${s.name} (${s.total_weekly_hours || 40}h/wk)`,
          }));
          setScheduleOptions(opts);

          // Set default schedule if none selected
          setFormData((prev) => {
            if (!prev.working_schedule_id && opts.length > 0) {
              return { ...prev, working_schedule_id: opts[0].value };
            }
            return prev;
          });
        }
      } catch {
        setScheduleOptions([
          { value: 'default', label: 'Standard 40-Hour Work Week (40h/wk)' },
        ]);
      }
    }
    loadSchedules();
  }, []);

  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && contract) {
      setFormData({
        employee_id: String(contract.employee_id || ''),
        contract_type: contract.contract_type || 'Permanent Full-Time',
        wage_rate: contract.wage_rate !== undefined ? String(contract.wage_rate) : '',
        wage_type: contract.wage_type ? String(contract.wage_type).toLowerCase() : 'monthly',
        start_date: contract.start_date ? contract.start_date.split('T')[0] : '',
        end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
        working_schedule_id: String(contract.working_schedule_id || ''),
        status: contract.status || 'ACTIVE',
        notes: contract.notes || '',
      });
    } else if (queryEmployeeId) {
      setFormData((prev) => ({ ...prev, employee_id: queryEmployeeId }));
    }
  }, [isEditMode, contract, queryEmployeeId]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.employee_id) errs.employee_id = 'Employee selection is required';
    if (!formData.contract_type) errs.contract_type = 'Contract type is required';
    if (!formData.wage_rate || isNaN(Number(formData.wage_rate)) || Number(formData.wage_rate) <= 0) {
      errs.wage_rate = 'Please enter a valid positive wage rate';
    }
    if (!formData.start_date) errs.start_date = 'Start date is required';
    if (formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
      errs.end_date = 'End date cannot be earlier than start date';
    }
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
      const payload = {
        ...formData,
        wage_rate: Number(formData.wage_rate),
        working_schedule_id: formData.working_schedule_id || null,
        end_date: formData.end_date || null,
      };

      if (isEditMode) {
        await contractsApi.updateContract(id, payload);
        setSuccessMessage('Contract updated successfully!');
      } else {
        await contractsApi.createContract(payload);
        setSuccessMessage('New contract issued successfully!');
      }

      setTimeout(() => {
        if (formData.employee_id) {
          navigate(`/employees/${formData.employee_id}`);
        } else {
          navigate('/contracts');
        }
      }, 800);
    } catch (err) {
      setApiError(err.message || 'Failed to save contract. Please verify dates and ensure no overlapping contracts exist.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isEditMode && loadingInitial) {
    return (
      <PageContainer title="Edit Contract">
        <Loading message="Loading contract agreement..." />
      </PageContainer>
    );
  }

  const contractTypeOptions = [
    { value: 'Permanent Full-Time', label: 'Permanent Full-Time' },
    { value: 'Fixed Term', label: 'Fixed Term' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Contractor', label: 'Contractor' },
    { value: 'Internship', label: 'Internship' },
  ];

  const wageTypeOptions = [
    { value: 'monthly', label: 'Monthly Fixed Salary' },
    { value: 'hourly', label: 'Hourly Rate' },
    { value: 'weekly', label: 'Weekly Wage' },
    { value: 'annual', label: 'Annual Salary' },
  ];

  const statusOptions = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  return (
    <PageContainer
      breadcrumbs={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link to="/contracts" style={{ color: 'var(--primary-600, #4f46e5)' }}>
            Contracts
          </Link>
          <span>/</span>
          <span>{isEditMode ? 'Edit Contract' : 'New Contract'}</span>
        </div>
      }
      title={isEditMode ? 'Edit Employment Contract' : 'Issue New Employment Contract'}
      subtitle="Establish binding employment terms and compensation baselines"
    >
      {apiError && (
        <Alert type="danger" title="Contract Validation Error">
          {apiError}
        </Alert>
      )}

      {successMessage && (
        <Alert type="success" title="Success">
          {successMessage}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Section 1: Employee & Position */}
        <FormSection
          title="Workforce Binding"
          description="Select employee and contract classification"
          columns={2}
        >
          {employeeOptions.length > 0 ? (
            <Select
              label="Assigned Employee"
              id="employee_id"
              required
              options={employeeOptions}
              value={formData.employee_id}
              onChange={(e) => handleChange('employee_id', e.target.value)}
              error={errors.employee_id}
              placeholder="Select an employee"
            />
          ) : (
            <Input
              label="Employee ID / UUID"
              id="employee_id"
              required
              placeholder="e.g. 42ead633-..."
              value={formData.employee_id}
              onChange={(e) => handleChange('employee_id', e.target.value)}
              error={errors.employee_id}
              helperText="Employee ID to bind this contract to"
            />
          )}

          <Select
            label="Contract Type"
            id="contract_type"
            required
            options={contractTypeOptions}
            value={formData.contract_type}
            onChange={(e) => handleChange('contract_type', e.target.value)}
            error={errors.contract_type}
          />
        </FormSection>

        {/* Section 2: Compensation & Wage Terms */}
        <FormSection
          title="Compensation & Wage Terms"
          description="Agreed pay rate consumed downstream by P3 Payroll"
          columns={2}
        >
          <Select
            label="Wage Type"
            id="wage_type"
            required
            options={wageTypeOptions}
            value={formData.wage_type}
            onChange={(e) => handleChange('wage_type', e.target.value)}
          />

          <Input
            label="Wage Rate (Amount)"
            id="wage_rate"
            type="number"
            required
            step="0.01"
            placeholder="e.g. 7500"
            value={formData.wage_rate}
            onChange={(e) => handleChange('wage_rate', e.target.value)}
            error={errors.wage_rate}
            leftIcon="$"
            helperText={formData.wage_type === 'hourly' ? 'Rate per hour worked' : 'Base salary per calendar month'}
          />

          <Select
            label="Assigned Working Schedule"
            id="working_schedule_id"
            options={scheduleOptions.length > 0 ? scheduleOptions : [{ value: '', label: 'Standard Schedule' }]}
            value={formData.working_schedule_id}
            onChange={(e) => handleChange('working_schedule_id', e.target.value)}
            helperText="Policy defining shifts and expected weekly hours"
          />

          <Select
            label="Contract Status"
            id="status"
            required
            options={statusOptions}
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            error={errors.status}
          />
        </FormSection>

        {/* Section 3: Duration & Dates */}
        <FormSection
          title="Effective Duration"
          description="Validity timeline for this contract (historical preservation)"
          columns={2}
        >
          <DatePicker
            label="Start Date"
            id="start_date"
            required
            value={formData.start_date}
            onChange={(e) => handleChange('start_date', e.target.value)}
            error={errors.start_date}
            helperText="Date from which this contract becomes legally active"
          />

          <DatePicker
            label="End Date (Leave blank if indefinite)"
            id="end_date"
            value={formData.end_date}
            onChange={(e) => handleChange('end_date', e.target.value)}
            error={errors.end_date}
            helperText="Leave empty for ongoing permanent contracts"
          />
        </FormSection>

        {/* Actions */}
        <FormActions
          onCancel={() => navigate('/contracts')}
          submitLabel={isEditMode ? 'Update Contract' : 'Issue Contract'}
          loading={submitting}
        />
      </form>
    </PageContainer>
  );
}
