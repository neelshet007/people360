import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PageContainer from '../../../components/layout/PageContainer';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Avatar from '../../../components/ui/Avatar';
import Alert from '../../../components/feedback/Alert';
import { useAuth } from '../../../context/AuthContext';
import { ROLES } from '../../../lib/auth';
import concernsApi from '../api/concernsApi';
import apiClient from '../../../lib/api/apiClient';
import {
  MessageSquareIcon,
  SendIcon,
  LockIcon,
  ClockIcon,
  CheckCircleIcon,
  UserIcon,
  FileTextIcon,
  ChevronRightIcon,
  CalendarIcon,
} from '../../../components/ui/Icons';

export default function ConcernDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const isEmployee = role === ROLES.EMPLOYEE;

  const [concern, setConcern] = useState(null);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // HR Controls
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [hrUsers, setHrUsers] = useState([]);
  const [assigning, setAssigning] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await concernsApi.getConcernById(id);
      const data = res.data;
      setConcern(data);
      setSelectedStatus(data.status);
      setSelectedAssignee(data.assigned_to_user_id || '');
    } catch (err) {
      setError(err.message || 'Unable to load concern details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Load HR assignees list for management users
  useEffect(() => {
    if (!isEmployee) {
      apiClient
        .get('/auth/users')
        .then((res) => {
          const staff = (res.data || []).filter((u) => u.role !== ROLES.EMPLOYEE);
          setHrUsers(staff);
        })
        .catch(() => {
          // Fallback if /auth/users is restricted
          setHrUsers([
            { id: user.id, name: user.name, role: user.role },
          ]);
        });
    }
  }, [isEmployee, user]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);
    setError(null);
    try {
      await concernsApi.addMessage(id, {
        message: replyText.trim(),
        isInternal: !isEmployee && isInternalNote,
      });
      setReplyText('');
      setIsInternalNote(false);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to send response.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedStatus || selectedStatus === concern.status) return;

    setUpdatingStatus(true);
    setError(null);
    try {
      await concernsApi.updateStatus(id, {
        status: selectedStatus,
        comment: statusComment || undefined,
      });
      setStatusComment('');
      setSuccessMsg(`Status updated to ${selectedStatus}`);
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to update status.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedAssignee || selectedAssignee === concern.assigned_to_user_id) return;

    setAssigning(true);
    setError(null);
    try {
      await concernsApi.assignConcern(id, {
        assignedToUserId: selectedAssignee,
      });
      setSuccessMsg('Concern assigned successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to assign concern.');
    } finally {
      setAssigning(false);
    }
  };

  const handleEmployeeClose = async () => {
    setUpdatingStatus(true);
    setError(null);
    try {
      await concernsApi.updateStatus(id, {
        status: 'CLOSED',
        comment: 'Employee confirmed resolution and closed case',
      });
      setSuccessMsg('Case closed successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to close case.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleEmployeeReopen = async () => {
    setUpdatingStatus(true);
    setError(null);
    try {
      await concernsApi.updateStatus(id, {
        status: 'OPEN',
        comment: 'Employee reopened case for follow-up inquiry',
      });
      setSuccessMsg('Case reopened successfully.');
      setTimeout(() => setSuccessMsg(null), 3500);
      await fetchDetail();
    } catch (err) {
      setError(err.message || 'Failed to reopen case.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="Concern Details">
        <Card style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ color: 'var(--neutral-500)' }}>Loading concern case details...</div>
        </Card>
      </PageContainer>
    );
  }

  if (error && !concern) {
    return (
      <PageContainer title="Concern Details">
        <Alert type="error" message={error} />
        <div style={{ marginTop: '16px' }}>
          <Button variant="secondary" onClick={() => navigate(isEmployee ? '/my-concerns' : '/concerns')}>
            ← Return to Concerns
          </Button>
        </div>
      </PageContainer>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="neutral">Open</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="primary">Under Review</Badge>;
      case 'WAITING_FOR_EMPLOYEE':
        return <Badge variant="warning">Waiting for Employee</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="info">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="neutral">Closed</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return <span style={{ color: '#ef4444', fontWeight: 700 }}>● Urgent</span>;
      case 'HIGH':
        return <span style={{ color: '#f97316', fontWeight: 600 }}>● High</span>;
      case 'MEDIUM':
        return <span style={{ color: '#3b82f6', fontWeight: 500 }}>● Medium</span>;
      default:
        return <span style={{ color: '#64748b', fontWeight: 500 }}>● Low</span>;
    }
  };

  return (
    <PageContainer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-700)', backgroundColor: 'var(--primary-50)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--primary-100)' }}>
            {concern.concern_code}
          </span>
          <span>{concern.subject}</span>
        </div>
      }
      subtitle={`Category: ${concern.category} • Created on ${new Date(concern.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`}
      actions={
        <Button
          variant="secondary"
          onClick={() => navigate(isEmployee ? '/my-concerns' : '/concerns')}
        >
          ← {isEmployee ? 'My Concerns' : 'All Concerns'}
        </Button>
      }
    >
      {error && <div style={{ marginBottom: '16px' }}><Alert type="error" message={error} /></div>}
      {successMsg && <div style={{ marginBottom: '16px' }}><Alert type="success" message={successMsg} /></div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(300px, 1fr)', gap: '20px', alignItems: 'start' }}>
        {/* ── LEFT COLUMN: Conversation & Timeline ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Main Case Description Header Card */}
          <Card title="Initial Case Description">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Avatar name={concern.raised_by_name} size={32} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--neutral-900)' }}>
                  {concern.raised_by_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  Raised by {concern.raised_by_role} • {new Date(concern.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.9375rem', color: 'var(--neutral-800)', lineHeight: '1.6', whiteSpace: 'pre-wrap', backgroundColor: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              {concern.description}
            </div>
          </Card>

          {/* Conversation Thread */}
          <Card title={`Case Conversation (${concern.messages?.length || 0})`}>
            {concern.messages && concern.messages.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                {concern.messages.map((msg) => {
                  const isSenderEmployee = msg.sender_role === ROLES.EMPLOYEE;
                  const isInternal = msg.is_internal;

                  return (
                    <div
                      key={msg.id}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '10px',
                        backgroundColor: isInternal
                          ? '#fffbeb'
                          : isSenderEmployee
                          ? '#ffffff'
                          : '#f0f9ff',
                        border: isInternal
                          ? '1px solid #fde68a'
                          : isSenderEmployee
                          ? '1px solid var(--neutral-200, #e2e8f0)'
                          : '1px solid #bae6fd',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar name={msg.sender_name} size={24} />
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: 'var(--neutral-900)' }}>
                            {msg.sender_name}
                          </span>
                          <span style={{ fontSize: '0.6875rem', color: 'var(--neutral-500)', backgroundColor: 'rgba(0,0,0,0.04)', padding: '1px 6px', borderRadius: '4px' }}>
                            {msg.sender_role}
                          </span>
                          {isInternal && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.6875rem', fontWeight: 700, color: '#b45309', backgroundColor: '#fef3c7', padding: '1px 6px', borderRadius: '4px' }}>
                              <LockIcon size={12} /> Internal HR Note (Private)
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--neutral-400)' }}>
                          {new Date(msg.created_at).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--neutral-800)', lineHeight: '1.55', whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--neutral-400)', fontSize: '0.875rem' }}>
                No follow-up messages yet.
              </div>
            )}

            {/* Response Input Box */}
            {concern.status !== 'CLOSED' ? (
              <form onSubmit={handleSendReply} style={{ borderTop: '1px solid var(--neutral-200)', paddingTop: '16px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <Textarea
                    placeholder="Type your response or update..."
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  {!isEmployee && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: '#b45309', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={isInternalNote}
                        onChange={(e) => setIsInternalNote(e.target.checked)}
                      />
                      <LockIcon size={14} color="#b45309" /> Internal note (Not visible to employee)
                    </label>
                  )}

                  <div style={{ marginLeft: 'auto' }}>
                    <Button
                      type="submit"
                      variant="primary"
                      loading={submittingReply}
                      disabled={submittingReply || !replyText.trim()}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <SendIcon size={14} /> Send Response
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '0.875rem', color: 'var(--neutral-500)' }}>
                This concern is marked as <strong>Closed</strong>.
                {isEmployee && (
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleEmployeeReopen}
                    loading={updatingStatus}
                    style={{ marginLeft: '10px' }}
                  >
                    Reopen Case
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Audit Timeline Card */}
          {concern.status_history && concern.status_history.length > 0 && (
            <Card title="Status History & Audit Trail">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {concern.status_history.map((h) => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.8125rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-600)', marginTop: '5px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: 'var(--neutral-800)' }}>
                        Status set to <strong>{h.to_status}</strong> by {h.changed_by_name} ({h.changed_by_role})
                      </div>
                      {h.comment && (
                        <div style={{ color: 'var(--neutral-500)', marginTop: '2px', fontSize: '0.75rem' }}>
                          "{h.comment}"
                        </div>
                      )}
                      <div style={{ fontSize: '0.6875rem', color: 'var(--neutral-400)', marginTop: '2px' }}>
                        {new Date(h.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── RIGHT COLUMN: Case Metadata & Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Metadata Card */}
          <Card title="Case Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={metaRowStyle}>
                <span style={metaLabelStyle}>Current Status</span>
                <span>{getStatusBadge(concern.status)}</span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaLabelStyle}>Priority</span>
                <span style={{ fontSize: '0.875rem' }}>{getPriorityBadge(concern.priority)}</span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaLabelStyle}>Category</span>
                <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--neutral-800)' }}>
                  {concern.category}
                </span>
              </div>
              <div style={metaRowStyle}>
                <span style={metaLabelStyle}>Created</span>
                <span style={{ fontSize: '0.8125rem', color: 'var(--neutral-600)' }}>
                  {new Date(concern.created_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {concern.resolved_at && (
                <div style={metaRowStyle}>
                  <span style={metaLabelStyle}>Resolved</span>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--success-700)', fontWeight: 600 }}>
                    {new Date(concern.resolved_at).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Linked Record Preview Card */}
          {concern.related_record && (
            <Card title="Authoritative Linked Record">
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>
                  <FileTextIcon size={14} color="#16a34a" /> {concern.related_record.type}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#14532d', marginBottom: '2px' }}>
                  {concern.related_record.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                  {concern.related_record.subtitle}
                </div>
              </div>
              <Button
                variant="secondary"
                size="small"
                style={{ width: '100%' }}
                onClick={() => navigate(concern.related_record.link)}
              >
                Inspect Associated Module Record →
              </Button>
            </Card>
          )}

          {/* Regarding Employee Profile Card */}
          <Card title="Regarding Employee">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Avatar name={`${concern.subject_first_name} ${concern.subject_last_name}`} size={36} />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--neutral-900)' }}>
                  {concern.subject_first_name} {concern.subject_last_name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--neutral-500)' }}>
                  {concern.subject_employee_code} • {concern.subject_department}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--neutral-600)', borderTop: '1px solid var(--neutral-100)', paddingTop: '8px' }}>
              Designation: <strong>{concern.subject_designation}</strong>
            </div>
          </Card>

          {/* Case Resolution / HR Actions Card */}
          {!isEmployee ? (
            <Card title="HR Management Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Update Lifecycle Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    options={[
                      { value: 'OPEN', label: 'Open' },
                      { value: 'UNDER_REVIEW', label: 'Under Review' },
                      { value: 'WAITING_FOR_EMPLOYEE', label: 'Waiting for Employee' },
                      { value: 'IN_PROGRESS', label: 'In Progress' },
                      { value: 'RESOLVED', label: 'Resolved' },
                      { value: 'CLOSED', label: 'Closed' },
                    ]}
                  />
                  <Button
                    variant="primary"
                    size="small"
                    onClick={handleUpdateStatus}
                    loading={updatingStatus}
                    disabled={updatingStatus || selectedStatus === concern.status}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Apply Status Transition
                  </Button>
                </div>

                <div style={{ borderTop: '1px solid var(--neutral-100)', paddingTop: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--neutral-600)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Assign Case
                  </label>
                  <Select
                    value={selectedAssignee}
                    onChange={(e) => setSelectedAssignee(e.target.value)}
                    options={[
                      { value: '', label: 'Select Assignee...' },
                      ...hrUsers.map((u) => ({
                        value: u.id,
                        label: `${u.name} (${u.role})`,
                      })),
                    ]}
                  />
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleAssign}
                    loading={assigning}
                    disabled={assigning || !selectedAssignee || selectedAssignee === concern.assigned_to_user_id}
                    style={{ width: '100%', marginTop: '8px' }}
                  >
                    Assign Case
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            concern.status === 'RESOLVED' && (
              <Card title="Case Resolution Confirmation">
                <p style={{ fontSize: '0.8125rem', color: 'var(--neutral-600)', margin: '0 0 12px 0' }}>
                  HR has marked this inquiry as resolved. If you are satisfied with the outcome, please close this case.
                </p>
                <Button
                  variant="success"
                  onClick={handleEmployeeClose}
                  loading={updatingStatus}
                  style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <CheckCircleIcon size={16} /> Confirm Resolution & Close Case
                </Button>
              </Card>
            )
          )}
        </div>
      </div>
    </PageContainer>
  );
}

const metaRowStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: '0.8125rem',
  paddingBottom: '8px',
  borderBottom: '1px solid var(--neutral-100, #f1f5f9)',
};

const metaLabelStyle = {
  color: 'var(--neutral-500)',
  fontWeight: 500,
};
