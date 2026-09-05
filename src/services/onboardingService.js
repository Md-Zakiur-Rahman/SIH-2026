import { API_BASE, USE_ONBOARDING_API } from '../config';
import { calculateFinance } from '../lib/finance';

const ONBOARDING_KEY = 'arthniti_onboarding';
const ASSESSMENTS_KEY = 'arthniti_assessments';

function createAssessmentId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readJson(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function readAssessments() {
  const stored = readJson(ASSESSMENTS_KEY);
  if (!Array.isArray(stored)) return [];
  const normalized = stored.map((assessment) => ({ ...assessment, id: assessment.id || createAssessmentId() }));
  if (normalized.some((assessment, index) => assessment.id !== stored[index].id)) localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(normalized));
  return normalized;
}

function migrateLegacyAssessment() {
  const assessments = readAssessments();
  if (assessments.length) return assessments;
  const legacy = readJson(ONBOARDING_KEY);
  if (!legacy?.input) return [];
  const migrated = { ...legacy, id: legacy.id || createAssessmentId() };
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify([migrated]));
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(migrated));
  return [migrated];
}

function newestFirst(assessments) {
  return [...assessments].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

async function mockPost(endpoint, payload) {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (endpoint === '/api/calculator') return calculateFinance(payload.margin);
  return { market_reach: { consumer_base: 'Local households and nearby town markets', channels: ['Local weekly market', 'Direct home delivery'] }, viability_score: 72, viability_reason: 'A clear starting point for a practical local business plan.', top_3_recommendations: ['Validate local demand before scaling', 'Plan a reliable supply chain', 'Keep records of every expense'] };
}

async function post(endpoint, payload) {
  if (!USE_ONBOARDING_API) return mockPost(endpoint, payload);
  const response = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('REQUEST_FAILED');
  return response.json();
}

export async function generatePlan(form) {
  const payload = { location: `${form.state}, ${form.district}, ${form.block}`, business_category: form.category, margin: Number(form.margin) };
  const [feasibility, calculator] = await Promise.all([post('/api/feasibility', payload), post('/api/calculator', { margin: payload.margin })]);
  const result = { id: createAssessmentId(), input: form, payload, feasibility, calculator, createdAt: new Date().toISOString() };
  const assessments = newestFirst([...migrateLegacyAssessment(), result]);
  localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(assessments));
  localStorage.setItem(ONBOARDING_KEY, JSON.stringify(result));
  return result;
}

export function getSavedPlan() {
  return readJson(ONBOARDING_KEY) || newestFirst(migrateLegacyAssessment())[0] || null;
}

export function getAssessments() {
  return newestFirst(migrateLegacyAssessment());
}

export function getAssessmentById(id) {
  return getAssessments().find((assessment) => assessment.id === id) || null;
}
