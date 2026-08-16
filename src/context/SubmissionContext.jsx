import { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import {
  EMPTY_BUILDING_DATA,
  EMPTY_OPERATIONAL_DATA,
  STATUSES,
} from '../data/constants.js';
import {
  loadSubmissions,
  saveSubmissions,
  loadRole,
  saveRole,
  loadOperatorName,
  saveOperatorName,
  loadActiveDraftId,
  saveActiveDraftId,
  loadOperatorOfficeId,
  saveOperatorOfficeId,
  loadOperatorOfficeName,
  saveOperatorOfficeName,
} from '../utils/localStorage.js';
import { parseNumericFields } from '../utils/validation.js';
import { createDemoSubmissions } from '../data/demoData.js';
import { enqueueSyncOperation, getQueuedOperations, subscribeToLiveUpdates } from '../utils/sync.js';
import { backendEnabled, getSubmissions as apiGetSubmissions, createSubmission as apiCreateSubmission, updateSubmission as apiUpdateSubmission, connectRealtime, logout as apiLogout } from '../utils/api.js';

function generateId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `submission-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createHistoryEntry(status, comment = null) {
  return {
    status,
    timestamp: new Date().toISOString(),
    ...(comment ? { comment } : {}),
  };
}

function createEmptySubmission(overrides = {}) {
  return {
    id: generateId(),
    postOffice: '',
    reportingPeriod: '',
    operator: '',
    buildingData: { ...EMPTY_BUILDING_DATA },
    operationalData: { ...EMPTY_OPERATIONAL_DATA },
    status: STATUSES.DRAFT,
    createdAt: new Date().toISOString(),
    submittedAt: null,
    reviewedAt: null,
    managerComment: null,
    evidence: [],
    ocr: { scans: [] },
    history: [createHistoryEntry(STATUSES.DRAFT)],
    ...overrides,
  };
}

const initialState = {
  submissions: [],
  role: null,
  operatorName: '',
  activeDraftId: null,
  operatorOfficeId: null,
  operatorOfficeName: '',
  hydrated: false,
};

function submissionReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return {
        ...state,
        submissions: action.payload.submissions,
        role: action.payload.role,
        operatorName: action.payload.operatorName,
        activeDraftId: action.payload.activeDraftId,
        operatorOfficeId: action.payload.operatorOfficeId || null,
        operatorOfficeName: action.payload.operatorOfficeName || '',
        hydrated: true,
      };

    case 'SET_OPERATOR_OFFICE':
      return { ...state, operatorOfficeId: action.payload.officeId || null, operatorOfficeName: action.payload.officeName || '' };

    case 'SET_ROLE':
      saveRole(action.payload);
      return { ...state, role: action.payload };

    case 'SET_OPERATOR_NAME':
      saveOperatorName(action.payload);
      return { ...state, operatorName: action.payload };

    case 'LOAD_DEMO_DATA': {
      const submissions = createDemoSubmissions();
      saveSubmissions(submissions);
      saveActiveDraftId(null);
      return { ...state, submissions, activeDraftId: null };
    }

    case 'SET_ACTIVE_DRAFT':
      saveActiveDraftId(action.payload);
      return { ...state, activeDraftId: action.payload };

    case 'CREATE_DRAFT': {
      const draft = createEmptySubmission({
        id: action.payload.id,
        operator: action.payload.operator || state.operatorName,
        postOffice: action.payload.postOffice || '',
        reportingPeriod: action.payload.reportingPeriod || '',
      });
      const submissions = [...state.submissions, draft];
      saveSubmissions(submissions);
      saveActiveDraftId(draft.id);
      return { ...state, submissions, activeDraftId: draft.id };
    }

    case 'UPDATE_DRAFT': {
      const { id, updates } = action.payload;
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          ...updates,
          buildingData: updates.buildingData
            ? { ...s.buildingData, ...updates.buildingData }
            : s.buildingData,
          operationalData: updates.operationalData
            ? { ...s.operationalData, ...updates.operationalData }
            : s.operationalData,
        };
      });
      saveSubmissions(submissions);
      return { ...state, submissions };
    }

    case 'SUBMIT_SUBMISSION': {
      const { id } = action.payload;
      if (!state.submissions.some((s) => s.id === id && s.status === STATUSES.DRAFT)) return state;
      const now = new Date().toISOString();
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        const status = STATUSES.PENDING_REVIEW;
        return {
          ...s,
          status,
          submittedAt: now,
          buildingData: parseNumericFields(s.buildingData),
          operationalData: parseNumericFields(s.operationalData),
          managerComment: null,
          history: [...s.history, createHistoryEntry(status)],
        };
      });
      saveSubmissions(submissions);
      saveActiveDraftId(null);
      return { ...state, submissions, activeDraftId: null };
    }

    case 'APPROVE_SUBMISSION': {
      const { id } = action.payload;
      if (!state.submissions.some((s) => s.id === id && s.status === STATUSES.PENDING_REVIEW)) return state;
      const now = new Date().toISOString();
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: STATUSES.APPROVED,
          reviewedAt: now,
          managerComment: null,
          history: [...s.history, createHistoryEntry(STATUSES.APPROVED)],
        };
      });
      saveSubmissions(submissions);
      return { ...state, submissions };
    }

    case 'REJECT_SUBMISSION': {
      const { id, comment } = action.payload;
      if (!state.submissions.some((s) => s.id === id && s.status === STATUSES.PENDING_REVIEW)) return state;
      const now = new Date().toISOString();
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: STATUSES.REJECTED,
          reviewedAt: now,
          managerComment: comment,
          history: [...s.history, createHistoryEntry(STATUSES.REJECTED, comment)],
        };
      });
      saveSubmissions(submissions);
      return { ...state, submissions };
    }

    case 'RETURN_FOR_CORRECTION': {
      const { id, comment } = action.payload;
      if (!state.submissions.some((s) => s.id === id && s.status === STATUSES.PENDING_REVIEW)) return state;
      const now = new Date().toISOString();
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        return {
          ...s,
          status: STATUSES.RETURNED,
          reviewedAt: now,
          managerComment: comment,
          history: [...s.history, createHistoryEntry(STATUSES.RETURNED, comment)],
        };
      });
      saveSubmissions(submissions);
      return { ...state, submissions };
    }

    case 'RESUBMIT': {
      const { id } = action.payload;
      if (!state.submissions.some((s) => s.id === id && s.status === STATUSES.RETURNED)) return state;
      const now = new Date().toISOString();
      const submissions = state.submissions.map((s) => {
        if (s.id !== id) return s;
        const status = STATUSES.PENDING_REVIEW;
        return {
          ...s,
          status,
          submittedAt: now,
          reviewedAt: null,
          managerComment: null,
          buildingData: parseNumericFields(s.buildingData),
          operationalData: parseNumericFields(s.operationalData),
          history: [...s.history, createHistoryEntry(status, 'Resubmitted after correction')],
        };
      });
      saveSubmissions(submissions);
      saveActiveDraftId(null);
      return { ...state, submissions, activeDraftId: null };
    }

    default:
      return state;
  }
}


function toSyncSubmission(submission, statusOverride = null, comment = null) {
  const statusMap = {
    Draft: 'DRAFT',
    'Pending Review': 'PENDING_REVIEW',
    Approved: 'APPROVED',
    Rejected: 'REJECTED',
    'Returned for Correction': 'RETURNED',
  };
  return {
    id: submission.id,
    clientId: submission.id,
    officeId: submission.officeId,
    postOffice: submission.postOffice,
    reportingPeriod: submission.reportingPeriod,
    status: statusOverride || statusMap[submission.status] || 'DRAFT',
    managerComment: comment ?? submission.managerComment ?? null,
    buildingData: submission.buildingData,
    operationalData: submission.operationalData,
  };
}

function isRetryableSyncError(error) {
  return !error?.status || error.status >= 500;
}

async function refreshFromServer(dispatch) {
  try {
    const submissions = await apiGetSubmissions();
    dispatch({ type: 'HYDRATE', payload: { submissions, role: loadRole(), operatorName: loadOperatorName(), activeDraftId: loadActiveDraftId(), operatorOfficeId: loadOperatorOfficeId(), operatorOfficeName: loadOperatorOfficeName() } });
  } catch (error) {
    if (error?.status === 401) {
      apiLogout();
      saveRole(null);
      dispatch({ type: 'HYDRATE', payload: { submissions: [], role: null, operatorName: '', activeDraftId: null } });
    }
  }
}

function queueSubmissionSync(submission, statusOverride = null, comment = null) {
  return enqueueSyncOperation({
    id: `submission-${submission.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    operation: 'UPSERT_SUBMISSION',
    data: toSyncSubmission(submission, statusOverride, comment),
  });
}

const SubmissionContext = createContext(null);

export function SubmissionProvider({ children }) {
  const [state, dispatch] = useReducer(submissionReducer, initialState);

  useEffect(() => {
    let cancelled = false;
    const hydrate = async () => {
      if (backendEnabled) {
        try {
          const serverSubmissions = await apiGetSubmissions();
          const localSubmissions = loadSubmissions();
          const queuedIds = new Set(getQueuedOperations().map((op) => op.data?.id || op.data?.clientId).filter(Boolean));
          const serverIds = new Set(serverSubmissions.map((s) => s.id));
          const merged = serverSubmissions.map((server) => queuedIds.has(server.id) ? (localSubmissions.find((local) => local.id === server.id) || server) : server);
          for (const local of localSubmissions) if (queuedIds.has(local.id) && !serverIds.has(local.id)) merged.push(local);
          if (!cancelled) dispatch({ type: 'HYDRATE', payload: { submissions: merged, role: loadRole(), operatorName: loadOperatorName(), activeDraftId: loadActiveDraftId(), operatorOfficeId: loadOperatorOfficeId(), operatorOfficeName: loadOperatorOfficeName() } });
          return;
        } catch (error) {
          if (error?.status === 401) {
            apiLogout();
            saveRole(null);
            if (!cancelled) dispatch({ type: 'HYDRATE', payload: { submissions: [], role: null, operatorName: '', activeDraftId: null } });
            return;
          }
          // Backend may be temporarily unavailable. Keep the local cache for offline work.
        }
      }
      if (!cancelled) dispatch({ type: 'HYDRATE', payload: { submissions: loadSubmissions(), role: loadRole(), operatorName: loadOperatorName(), activeDraftId: loadActiveDraftId(), operatorOfficeId: loadOperatorOfficeId(), operatorOfficeName: loadOperatorOfficeName() } });
    };
    hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let stopRealtime = () => {};
    let cancelled = false;
    connectRealtime(() => {
      apiGetSubmissions().then((submissions) => dispatch({ type: 'HYDRATE', payload: { submissions, role: loadRole(), operatorName: loadOperatorName(), activeDraftId: loadActiveDraftId(), operatorOfficeId: loadOperatorOfficeId(), operatorOfficeName: loadOperatorOfficeName() } })).catch(() => {});
    }).then((cleanup) => { if (!cancelled) stopRealtime = cleanup; else cleanup(); });
    const unsubscribe = subscribeToLiveUpdates((event) => {
      if (event.payload?.submissions && Array.isArray(event.payload.submissions)) {
        dispatch({ type: 'HYDRATE', payload: { submissions: event.payload.submissions, role: loadRole(), operatorName: loadOperatorName(), activeDraftId: loadActiveDraftId(), operatorOfficeId: loadOperatorOfficeId(), operatorOfficeName: loadOperatorOfficeName() } });
      }
    });
    return () => { cancelled = true; unsubscribe(); stopRealtime(); };
  }, [state.role, state.hydrated]);

  const createDraft = useCallback((payload = {}) => {
    const id = payload.id || generateId();
    dispatch({ type: 'CREATE_DRAFT', payload: { ...payload, id } });
    if (backendEnabled) {
      const local = createEmptySubmission({ ...payload, id, operator: payload.operator || state.operatorName });
      apiCreateSubmission(local).catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync(local); else refreshFromServer(dispatch); });
    }
    return id;
  }, [state.operatorName]);

  const updateDraft = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_DRAFT', payload: { id, updates } });
    if (backendEnabled) {
      const current = state.submissions.find((s) => s.id === id);
      if (current) {
        const next = { ...current, ...updates, buildingData: { ...current.buildingData, ...(updates.buildingData || {}) }, operationalData: { ...current.operationalData, ...(updates.operationalData || {}) } };
        apiUpdateSubmission(id, next).catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync(next); else refreshFromServer(dispatch); });
      }
    }
  }, [state.submissions]);

  const submitSubmission = useCallback((id) => {
    const current = state.submissions.find((s) => s.id === id);
    dispatch({ type: 'SUBMIT_SUBMISSION', payload: { id } });
    if (backendEnabled && current) apiUpdateSubmission(id, current, 'SUBMIT').catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync({ ...current, status: STATUSES.PENDING_REVIEW }, 'PENDING_REVIEW'); else refreshFromServer(dispatch); });
  }, [state.submissions]);

  const approveSubmission = useCallback((id) => {
    const current = state.submissions.find((s) => s.id === id);
    dispatch({ type: 'APPROVE_SUBMISSION', payload: { id } });
    if (backendEnabled && current) apiUpdateSubmission(id, current, 'APPROVED').catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync({ ...current, status: STATUSES.APPROVED }, 'APPROVED'); else refreshFromServer(dispatch); });
  }, [state.submissions]);

  const rejectSubmission = useCallback((id, comment) => {
    const current = state.submissions.find((s) => s.id === id);
    dispatch({ type: 'REJECT_SUBMISSION', payload: { id, comment } });
    if (backendEnabled && current) apiUpdateSubmission(id, current, 'REJECTED', comment).catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync({ ...current, status: STATUSES.REJECTED, managerComment: comment }, 'REJECTED', comment); else refreshFromServer(dispatch); });
  }, [state.submissions]);

  const returnForCorrection = useCallback((id, comment) => {
    const current = state.submissions.find((s) => s.id === id);
    dispatch({ type: 'RETURN_FOR_CORRECTION', payload: { id, comment } });
    if (backendEnabled && current) apiUpdateSubmission(id, current, 'RETURNED', comment).catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync({ ...current, status: STATUSES.RETURNED, managerComment: comment }, 'RETURNED', comment); else refreshFromServer(dispatch); });
  }, [state.submissions]);

  const resubmit = useCallback((id) => {
    const current = state.submissions.find((s) => s.id === id);
    dispatch({ type: 'RESUBMIT', payload: { id } });
    if (backendEnabled && current) apiUpdateSubmission(id, current, 'RESUBMIT').catch((error) => { if (isRetryableSyncError(error)) queueSubmissionSync({ ...current, status: STATUSES.PENDING_REVIEW }, 'PENDING_REVIEW'); else refreshFromServer(dispatch); });
  }, [state.submissions]);

  const setOperatorOffice = useCallback((officeId, officeName) => {
    saveOperatorOfficeId(officeId);
    saveOperatorOfficeName(officeName);
    dispatch({ type: 'SET_OPERATOR_OFFICE', payload: { officeId, officeName } });
  }, []);

  const setRole = useCallback((role) => {
    dispatch({ type: 'SET_ROLE', payload: role });
  }, []);

  const setOperatorName = useCallback((name) => {
    dispatch({ type: 'SET_OPERATOR_NAME', payload: name });
  }, []);

  const loadDemoData = useCallback(() => {
    dispatch({ type: 'LOAD_DEMO_DATA' });
  }, []);

  const setActiveDraftId = useCallback((id) => {
    dispatch({ type: 'SET_ACTIVE_DRAFT', payload: id });
  }, []);

  const getSubmissionById = useCallback(
    (id) => state.submissions.find((s) => s.id === id),
    [state.submissions]
  );

  const getActiveDraft = useCallback(() => {
    if (!state.activeDraftId) return null;
    return state.submissions.find((s) => s.id === state.activeDraftId) || null;
  }, [state.activeDraftId, state.submissions]);

  const value = {
    ...state,
    createDraft,
    updateDraft,
    submitSubmission,
    approveSubmission,
    rejectSubmission,
    returnForCorrection,
    resubmit,
    setRole,
    setOperatorName,
    setOperatorOffice,
    setActiveDraftId,
    loadDemoData,
    getSubmissionById,
    getActiveDraft,
  };

  return (
    <SubmissionContext.Provider value={value}>
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmissions() {
  const ctx = useContext(SubmissionContext);
  if (!ctx) throw new Error('useSubmissions must be used within SubmissionProvider');
  return ctx;
}

export { STATUSES };
