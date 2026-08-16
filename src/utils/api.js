const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const API_ORIGIN = API_URL
    ? new URL(API_URL, window.location.origin).origin
    : "";
const STATUS_FROM_API = {
    DRAFT: "Draft",
    PENDING_REVIEW: "Pending Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    RETURNED: "Returned for Correction",
};

export const backendEnabled = Boolean(API_URL);
const TOKEN_KEY = "india-post-brsr-api-token";

function normalizeSubmission(s) {
    const operatorUser =
        s.operator && typeof s.operator === "object" ? s.operator : null;
    const operatorName =
        operatorUser?.name ||
        operatorUser?.email ||
        (typeof s.operator === "string" ? s.operator : "") ||
        "";
    return {
        ...s,
        postOffice: s.postOffice || s.office?.name || "",
        officeId: s.officeId || s.office?.id || "",
        operator: operatorName,
        operatorUser,
        status: STATUS_FROM_API[s.status] || s.status,
        buildingData: {
            buildingType: s.buildingData?.buildingType || "",
            areaSqFt: s.buildingData?.areaSqFt ?? "",
            electricityConsumptionKwh:
                s.buildingData?.electricityConsumption ?? "",
            waterUsageKl: s.buildingData?.waterUsage ?? "",
            wasteGeneratedKg: s.buildingData?.wasteGenerated ?? "",
            renewableEnergyKwh: s.buildingData?.renewableEnergy ?? "",
            fuelConsumptionLitres: s.buildingData?.fuelConsumption ?? "",
            greenCoverSqFt: s.buildingData?.greenCover ?? "",
        },
        operationalData: {
            totalEmployees: s.operationalData?.totalEmployees ?? "",
            femaleEmployees: s.operationalData?.femaleEmployees ?? "",
            digitalTransactionsPercent:
                s.operationalData?.digitalTransactionsPct ?? "",
            energyUsageKwh: s.operationalData?.energyUsageKwh ?? "",
            trainingHoursPerEmployee:
                s.operationalData?.trainingHoursPerEmployee ?? "",
            communityProgramsCount:
                s.operationalData?.communityProgramsCount ?? "",
            grievancesResolved: s.operationalData?.grievancesResolved ?? "",
            grievancesTotal: s.operationalData?.grievancesTotal ?? "",
        },
        evidence: Array.isArray(s.evidence)
            ? s.evidence.map((e) => ({
                  ...e,
                  name: e.name || e.filename,
                  uploadedAt: e.uploadedAt,
              }))
            : [],
        history: Array.isArray(s.history)
            ? s.history.map((h) => ({
                  ...h,
                  status: STATUS_FROM_API[h.status] || h.status,
                  timestamp: h.timestamp || h.createdAt,
              }))
            : [],
    };
}

export function getToken() {
    try {
        return localStorage.getItem(TOKEN_KEY) || "";
    } catch {
        return "";
    }
}

export function setToken(token) {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch {}
}

async function request(path, options = {}) {
    if (!backendEnabled) throw new Error("Backend mode is disabled");
    const headers = new Headers(options.headers || {});
    if (!(options.body instanceof FormData))
        headers.set("Content-Type", "application/json");
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(`${API_URL}${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        const error = new Error(
            data.error || `Request failed (${response.status})`,
        );
        error.status = response.status;
        error.details = data.details;
        throw error;
    }
    return data;
}

export async function login(email, password) {
    const data = await request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data.user;
}

export function logout() {
    setToken("");
}

export async function me() {
    return (await request("/auth/me")).user;
}

export async function getSubmissions() {
    return (await request("/submissions")).map(normalizeSubmission);
}

export async function getOffices() {
    return request("/offices");
}

function toApiSubmission(submission) {
    return {
        clientId: submission.id,
        officeId: submission.officeId,
        postOffice: submission.postOffice,
        reportingPeriod: submission.reportingPeriod,
        status:
            submission.status === "Pending Review" ? "PENDING_REVIEW" : "DRAFT",
        buildingData: submission.buildingData,
        operationalData: submission.operationalData,
    };
}

export async function createSubmission(submission) {
    return normalizeSubmission(
        await request("/submissions", {
            method: "POST",
            body: JSON.stringify(toApiSubmission(submission)),
        }),
    );
}

export async function updateSubmission(
    id,
    submission,
    statusAction = null,
    comment = null,
) {
    return normalizeSubmission(
        await request(`/submissions/${encodeURIComponent(id)}`, {
            method: "PUT",
            body: JSON.stringify({
                buildingData: submission.buildingData,
                operationalData: submission.operationalData,
                status: statusAction,
                comment,
            }),
        }),
    );
}

export async function uploadEvidence({
    submissionId,
    file,
    category,
    ocrText,
    ocrConfidence,
}) {
    const form = new FormData();
    form.append("submissionId", submissionId);
    form.append("file", file);
    if (category) form.append("category", category);
    if (ocrText) form.append("ocrText", ocrText);
    if (ocrConfidence != null)
        form.append("ocrConfidence", String(ocrConfidence));
    return request("/evidence", { method: "POST", body: form });
}

export async function syncOperations(operations) {
    return request("/sync", {
        method: "POST",
        body: JSON.stringify({ operations }),
    });
}

export async function connectRealtime(onUpdate) {
    if (!backendEnabled || typeof EventSource === "undefined" || !getToken())
        return () => {};
    try {
        const { ticket } = await request("/events/ticket");
        if (!ticket) return () => {};
        const eventsUrl = `${API_URL}/events?ticket=${encodeURIComponent(ticket)}`;
        const source = new EventSource(eventsUrl);
        const handler = (event) => {
            try {
                onUpdate?.(JSON.parse(event.data));
            } catch {}
        };
        source.addEventListener("submission.updated", handler);
        return () => source.close();
    } catch {
        return () => {};
    }
}

export { API_URL };
