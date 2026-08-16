const STORAGE_KEY = 'india-post-brsr-submissions';
const ROLE_KEY = 'india-post-brsr-role';
const OPERATOR_NAME_KEY = 'india-post-brsr-operator-name';
const ACTIVE_DRAFT_KEY = 'india-post-brsr-active-draft';
const OPERATOR_OFFICE_ID_KEY = 'india-post-brsr-operator-office-id';
const OPERATOR_OFFICE_NAME_KEY = 'india-post-brsr-operator-office-name';
import { publishLiveUpdate } from './sync.js';

export function loadSubmissions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSubmissions(submissions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions));
  publishLiveUpdate({ reason: 'SUBMISSIONS_SAVED', submissions });
}

export function loadRole() {
  return localStorage.getItem(ROLE_KEY) || null;
}

export function saveRole(role) {
  if (role) localStorage.setItem(ROLE_KEY, role);
  else localStorage.removeItem(ROLE_KEY);
}

export function loadOperatorName() {
  return localStorage.getItem(OPERATOR_NAME_KEY) || '';
}

export function saveOperatorName(name) {
  localStorage.setItem(OPERATOR_NAME_KEY, name);
}

export function loadActiveDraftId() {
  return localStorage.getItem(ACTIVE_DRAFT_KEY) || null;
}

export function saveActiveDraftId(id) {
  if (id) localStorage.setItem(ACTIVE_DRAFT_KEY, id);
  else localStorage.removeItem(ACTIVE_DRAFT_KEY);
}

export function loadOperatorOfficeId() { try { return localStorage.getItem(OPERATOR_OFFICE_ID_KEY) || null; } catch { return null; } }
export function saveOperatorOfficeId(id) { if (id) localStorage.setItem(OPERATOR_OFFICE_ID_KEY, id); else localStorage.removeItem(OPERATOR_OFFICE_ID_KEY); }
export function loadOperatorOfficeName() { try { return localStorage.getItem(OPERATOR_OFFICE_NAME_KEY) || ''; } catch { return ''; } }
export function saveOperatorOfficeName(name) { if (name) localStorage.setItem(OPERATOR_OFFICE_NAME_KEY, name); else localStorage.removeItem(OPERATOR_OFFICE_NAME_KEY); }
