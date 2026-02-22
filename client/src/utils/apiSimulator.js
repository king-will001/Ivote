import { clearAuth, loadAuth } from './authStorage';

const normalizeBaseUrl = (value) => String(value || '').replace(/\/+$/, '');
const API_BASE_URL = normalizeBaseUrl(
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api'
);
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

const buildUrl = (path) => {
  if (!path) return API_BASE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

const normalizeMediaUrl = (url) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url) || url.startsWith('data:')) return url;
  if (url.startsWith('/')) {
    return API_ORIGIN ? `${API_ORIGIN}${url}` : url;
  }
  return url;
};

const getAuthToken = () => {
  const auth = loadAuth();
  return auth?.token || null;
};

const getCookieValue = (name) => {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  const prefix = `${name}=`;
  const entry = cookies.find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
};

let csrfTokenCache = null;

const fetchCsrfToken = async () => {
  try {
    const response = await fetch(buildUrl('/csrf'), {
      method: 'GET',
      credentials: 'include',
    });
    const payload = await parseResponse(response);
    if (response.ok && payload?.csrfToken) {
      csrfTokenCache = payload.csrfToken;
      return csrfTokenCache;
    }
  } catch (error) {
    return null;
  }
  return null;
};

const ensureCsrfToken = async () => {
  if (csrfTokenCache) return csrfTokenCache;
  const cookieToken = getCookieValue('csrf-token');
  if (cookieToken) {
    csrfTokenCache = cookieToken;
    return csrfTokenCache;
  }
  return fetchCsrfToken();
};

const isStateChangingMethod = (method) =>
  ['POST', 'PUT', 'PATCH', 'DELETE'].includes(String(method).toUpperCase());

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch (error) {
      return null;
    }
  }
  const text = await response.text();
  return text ? { message: text } : null;
};

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    data,
    headers = {},
    auth = false,
    skipAuthRefresh = false,
    _retry = false,
  } = options;
  const token = auth ? getAuthToken() : null;

  const fetchOptions = {
    method,
    headers: { ...headers },
    credentials: 'include',
  };

  if (token) {
    fetchOptions.headers.Authorization = `Bearer ${token}`;
  }

  if (isStateChangingMethod(method)) {
    const csrfToken = await ensureCsrfToken();
    if (csrfToken) {
      fetchOptions.headers['x-csrf-token'] = csrfToken;
    }
  }

  if (data instanceof FormData) {
    fetchOptions.body = data;
  } else if (data !== undefined) {
    fetchOptions.headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(buildUrl(path), fetchOptions);
    const payload = await parseResponse(response);

    if (!response.ok) {
      if (response.status === 401 && !_retry && !skipAuthRefresh) {
        const refreshed = await request('/voters/refresh', {
          method: 'POST',
          skipAuthRefresh: true,
        });
        if (refreshed.success) {
          return request(path, { ...options, _retry: true });
        }
        clearAuth();
      }
      return {
        success: false,
        message: payload?.message || response.statusText || 'Request failed',
        status: response.status,
        data: payload,
      };
    }

    return { success: true, data: payload };
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Network error',
    };
  }
};

const mapCandidate = (candidate = {}) => {
  const firstName = candidate.firstName || '';
  const lastName = candidate.lastName || '';
  const fullName =
    candidate.fullName ||
    [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    id: candidate._id || candidate.id,
    fullName: fullName || 'Unknown candidate',
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    motto: candidate.motto,
    image: normalizeMediaUrl(candidate.image),
    voteCount:
      candidate.voteCount ??
      candidate.votesCount ??
      candidate.votes ??
      0,
    election: candidate.election,
  };
};

const mapElection = (election = {}) => {
  const startTime = election.startTime || election.startDate || election.date || null;
  const endTime = election.endTime || election.endDate || null;
  const candidates = Array.isArray(election.candidates)
    ? election.candidates.map((candidate) =>
        typeof candidate === 'string' ? { id: candidate } : mapCandidate(candidate)
      )
    : [];

  return {
    id: election._id || election.id,
    title: election.title,
    description: election.description,
    thumbnail: normalizeMediaUrl(election.thumbnail),
    startTime,
    endTime,
    startDate: startTime,
    endDate: endTime,
    date: election.date || startTime,
    candidates,
    voters: election.voters || [],
    isActive: election.isActive,
    totalVotes: typeof election.totalVotes === 'number' ? election.totalVotes : undefined,
  };
};

const mapNews = (post = {}) => ({
  id: post._id || post.id,
  title: post.title,
  content: post.content,
  author: post.author,
  date: post.createdAt || post.date,
  mediaType: post.mediaType || null,
  mediaUrl: normalizeMediaUrl(post.mediaUrl),
  summary: post.summary,
  category: post.category,
  sourceUrl: post.sourceUrl,
});

const mapVoter = (voter = {}) => ({
  id: voter.id || voter._id,
  firstName: voter.firstName,
  lastName: voter.lastName,
  fullName:
    voter.fullName ||
    [voter.firstName, voter.lastName].filter(Boolean).join(' ').trim(),
  email: voter.email,
  time: voter.time,
});

const toIsoString = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

export const fetchNews = async () => {
  const response = await request('/news');
  if (!response.success) return response;
  const rawNews = Array.isArray(response.data?.news)
    ? response.data.news
    : Array.isArray(response.data)
      ? response.data
      : [];
  const posts = rawNews.map(mapNews);
  return { success: true, data: posts };
};

export const fetchNewsById = async (id) => {
  if (!id) return { success: false, message: 'News ID is required.' };
  const response = await request(`/news/${id}`);
  if (!response.success) return response;
  return { success: true, data: mapNews(response.data?.post || response.data) };
};

export const createNews = async (newPost) => {
  const response = await request('/news', {
    method: 'POST',
    data: newPost,
    auth: true,
  });
  if (!response.success) return response;
  return { success: true, data: mapNews(response.data?.post || response.data) };
};

export const deleteNews = async (id) => {
  if (!id) return { success: false, message: 'News ID is required.' };
  return request(`/news/${id}`, { method: 'DELETE', auth: true });
};

export const fetchElections = async () => {
  const response = await request('/elections');
  if (!response.success) return response;
  const rawElections = Array.isArray(response.data?.elections)
    ? response.data.elections
    : Array.isArray(response.data)
      ? response.data
      : [];
  const elections = rawElections.map(mapElection);
  return { success: true, data: elections };
};

export const fetchElectionById = async (id) => {
  if (!id) return { success: false, message: 'Election ID is required.' };
  const response = await request(`/elections/${id}`);
  if (!response.success) return response;
  return { success: true, data: mapElection(response.data?.election || response.data) };
};

export const createElection = async (newElection) => {
  const formData = new FormData();
  formData.append('title', newElection.title || '');
  formData.append('description', newElection.description || '');

  const startTime = toIsoString(newElection.startTime || newElection.startDate);
  const endTime = toIsoString(newElection.endTime || newElection.endDate);
  if (startTime) formData.append('startTime', startTime);
  if (endTime) formData.append('endTime', endTime);

  if (newElection.thumbnail) {
    formData.append('thumbnail', newElection.thumbnail);
  }

  const response = await request('/elections', {
    method: 'POST',
    data: formData,
    auth: true,
  });

  if (!response.success) return response;
  return { success: true, data: mapElection(response.data?.election || response.data) };
};

export const updateElection = async (updatedElection) => {
  if (!updatedElection?.id) {
    return { success: false, message: 'Election ID is required.' };
  }

  const payload = {
    title: updatedElection.title,
    description: updatedElection.description,
  };

  const startTime = toIsoString(updatedElection.startTime || updatedElection.startDate);
  const endTime = toIsoString(updatedElection.endTime || updatedElection.endDate);
  if (startTime) payload.startTime = startTime;
  if (endTime) payload.endTime = endTime;

  if (updatedElection.thumbnail) {
    if (typeof File !== 'undefined' && updatedElection.thumbnail instanceof File) {
      payload.thumbnail = await fileToDataUrl(updatedElection.thumbnail);
    } else {
      payload.thumbnail = updatedElection.thumbnail;
    }
  }

  const response = await request(`/elections/${updatedElection.id}`, {
    method: 'PATCH',
    data: payload,
    auth: true,
  });

  if (!response.success) return response;
  return { success: true, data: mapElection(response.data?.election || response.data) };
};

export const deleteElection = async (id) => {
  if (!id) return { success: false, message: 'Election ID is required.' };
  return request(`/elections/${id}`, { method: 'DELETE', auth: true });
};

export const fetchCandidates = async (electionId) => {
  if (!electionId) {
    return { success: false, message: 'Election ID is required.' };
  }
  const response = await request(`/elections/${electionId}/candidates`);
  if (!response.success) return response;
  const rawCandidates = Array.isArray(response.data?.candidates)
    ? response.data.candidates
    : Array.isArray(response.data)
      ? response.data
      : [];
  const candidates = rawCandidates.map(mapCandidate);
  return { success: true, data: candidates };
};

export const fetchVoters = async (electionId) => {
  if (!electionId) {
    return { success: false, message: 'Election ID is required.' };
  }
  const response = await request(`/elections/${electionId}/voters`, { auth: true });
  if (!response.success) return response;
  const rawVoters = Array.isArray(response.data?.voters)
    ? response.data.voters
    : Array.isArray(response.data)
      ? response.data
      : [];
  const voters = rawVoters.map(mapVoter);
  return { success: true, data: voters };
};

export const createCandidate = async (newCandidate) => {
  const electionId = newCandidate?.election || newCandidate?.electionId;
  if (!electionId) {
    return { success: false, message: 'Election ID is required.' };
  }

  const formData = new FormData();
  if (newCandidate.fullName) formData.append('fullName', newCandidate.fullName);
  if (newCandidate.firstName) formData.append('firstName', newCandidate.firstName);
  if (newCandidate.lastName) formData.append('lastName', newCandidate.lastName);
  if (newCandidate.motto) formData.append('motto', newCandidate.motto);
  if (newCandidate.photo) {
    formData.append('photo', newCandidate.photo);
  } else if (newCandidate.image) {
    formData.append('image', newCandidate.image);
  }

  const response = await request(`/elections/${electionId}/candidates`, {
    method: 'POST',
    data: formData,
    auth: true,
  });

  if (!response.success) return response;
  return { success: true, data: mapCandidate(response.data?.candidate || response.data) };
};

export const deleteCandidate = async (electionId, candidateId) => {
  if (!electionId || !candidateId) {
    return { success: false, message: 'Election and candidate IDs are required.' };
  }
  return request(`/elections/${electionId}/candidates/${candidateId}`, {
    method: 'DELETE',
    auth: true,
  });
};

export const castVote = async (electionId, candidateId) => {
  if (!electionId || !candidateId) {
    return { success: false, message: 'Election and candidate IDs are required.' };
  }
  const response = await request(`/elections/${electionId}/votes`, {
    method: 'POST',
    data: { candidateId },
    auth: true,
  });
  if (!response.success) return response;
  return { success: true, data: response.data };
};

const fetchLiveResults = async (electionId, options = {}) => {
  const response = await request(`/analytics/elections/${electionId}/live-results`, {
    auth: Boolean(options.auth),
  });
  if (!response.success) return response;
  return { success: true, data: response.data?.data || response.data };
};

const fetchElectionTotals = async (electionId) => {
  const response = await request(`/analytics/elections/${electionId}/total-votes`);
  if (!response.success) return response;
  return { success: true, data: response.data?.data || response.data };
};

const fetchElectionStats = async (electionId, options = {}) => {
  const response = await request(`/analytics/elections/${electionId}/stats`, {
    auth: Boolean(options.auth),
  });
  if (!response.success) return response;
  return { success: true, data: response.data?.data || response.data };
};

export const fetchResults = async (options = {}) => {
  const includeLiveForOpen = Boolean(options.includeLiveForOpen);
  const includeAuth = Boolean(options.auth);
  const electionsResponse = await fetchElections();
  if (!electionsResponse.success) return electionsResponse;

  const elections = electionsResponse.data;
  const isElectionClosed = (election) => {
    const endValue = election?.endTime || election?.endDate;
    if (!endValue) return false;
    const endTime = new Date(endValue).getTime();
    if (Number.isNaN(endTime)) return false;
    return Date.now() >= endTime;
  };
  const results = await Promise.all(
    elections.map(async (election) => {
      const isClosed = isElectionClosed(election);
      const candidateCount = Array.isArray(election?.candidates)
        ? election.candidates.length
        : 0;
      if (!isClosed && !includeLiveForOpen) {
        let totalVotes =
          typeof election.totalVotes === 'number' ? election.totalVotes : null;
        if (totalVotes === null) {
          const totalsResponse = await fetchElectionTotals(election.id);
          totalVotes = totalsResponse.success
            ? totalsResponse.data?.totalVotes || 0
            : 0;
        }
        return {
          id: election.id,
          title: election.title,
          thumbnail: election.thumbnail,
          totalVotes: totalVotes || 0,
          candidates: [],
          startTime: election.startTime,
          endTime: election.endTime,
          isClosed: false,
          showProgress: false,
          candidateCount,
        };
      }
      const liveResponse = await fetchLiveResults(election.id, { auth: includeAuth });
      if (!liveResponse.success) {
        let totalVotes =
          typeof election.totalVotes === 'number' ? election.totalVotes : null;
        if (totalVotes === null) {
          const totalsResponse = await fetchElectionTotals(election.id);
          totalVotes = totalsResponse.success
            ? totalsResponse.data?.totalVotes || 0
            : 0;
        }
        if (!isClosed) {
          return {
            id: election.id,
            title: election.title,
            thumbnail: election.thumbnail,
            totalVotes: totalVotes || 0,
            candidates: [],
            startTime: election.startTime,
            endTime: election.endTime,
            isClosed: false,
            showProgress: false,
            candidateCount,
          };
        }
        return {
          id: election.id,
          title: election.title,
          thumbnail: election.thumbnail,
          totalVotes: totalVotes || 0,
          candidates: [],
          startTime: election.startTime,
          endTime: election.endTime,
          isClosed: true,
          showProgress: false,
          candidateCount,
        };
      }
      const payload = liveResponse.data || {};
      const candidates = Array.isArray(payload.results)
        ? payload.results.map((candidate) => ({
            id: candidate.candidateId || candidate.id,
            fullName: candidate.candidateName,
            image: normalizeMediaUrl(candidate.candidateImage),
            voteCount: candidate.voteCount || 0,
            percentage: candidate.percentage || 0,
          }))
        : [];
      return {
        id: election.id,
        title: payload.title || election.title,
        thumbnail: election.thumbnail,
        totalVotes: payload.totalVotes || 0,
        candidates,
        startTime: election.startTime,
        endTime: election.endTime,
        isClosed: isClosed,
        showProgress: !isClosed && includeLiveForOpen,
        candidateCount: candidateCount || candidates.length,
      };
    })
  );

  return { success: true, data: results };
};

export const fetchElectionResult = async (electionId, options = {}) => {
  if (!electionId) {
    return { success: false, message: 'Election ID is required.' };
  }

  const includeLiveForOpen = Boolean(options.includeLiveForOpen);
  const includeAuth = Boolean(options.auth);
  const electionResponse = await fetchElectionById(electionId);
  if (!electionResponse.success) return electionResponse;

  const election = electionResponse.data;
  const isElectionClosed = (value) => {
    const endValue = value?.endTime || value?.endDate;
    if (!endValue) return false;
    const endTime = new Date(endValue).getTime();
    if (Number.isNaN(endTime)) return false;
    return Date.now() >= endTime;
  };

  const isClosed = isElectionClosed(election);
  const candidateCount = Array.isArray(election?.candidates)
    ? election.candidates.length
    : 0;

  const basePayload = {
    id: election.id,
    title: election.title,
    description: election.description,
    thumbnail: election.thumbnail,
    startTime: election.startTime,
    endTime: election.endTime,
    isClosed,
    showProgress: !isClosed && includeLiveForOpen,
    candidateCount,
  };

  const resolveTotals = async () => {
    let totalVotes =
      typeof election.totalVotes === 'number' ? election.totalVotes : null;
    if (totalVotes === null) {
      const totalsResponse = await fetchElectionTotals(electionId);
      totalVotes = totalsResponse.success ? totalsResponse.data?.totalVotes || 0 : 0;
    }
    return totalVotes || 0;
  };

  const mapResultCandidates = (items = []) =>
    items.map((candidate) => ({
      id: candidate.candidateId || candidate.id || candidate._id,
      fullName: candidate.candidateName || candidate.fullName || 'Unknown candidate',
      image: normalizeMediaUrl(candidate.candidateImage || candidate.image),
      voteCount: candidate.voteCount || 0,
      percentage: candidate.percentage || 0,
    }));

  if (!isClosed && !includeLiveForOpen) {
    const totalVotes = await resolveTotals();
    return {
      success: true,
      data: {
        ...basePayload,
        totalVotes,
        candidates: [],
        showProgress: false,
      },
    };
  }

  const liveResponse = await fetchLiveResults(electionId, { auth: includeAuth });
  if (liveResponse.success) {
    const payload = liveResponse.data || {};
    const candidates = Array.isArray(payload.results)
      ? mapResultCandidates(payload.results)
      : [];
    return {
      success: true,
      data: {
        ...basePayload,
        title: payload.title || basePayload.title,
        totalVotes: payload.totalVotes || 0,
        candidates,
        candidateCount: candidateCount || candidates.length,
      },
    };
  }

  if (isClosed) {
    const statsResponse = await fetchElectionStats(electionId, { auth: includeAuth });
    if (statsResponse.success) {
      const payload = statsResponse.data || {};
      const candidates = Array.isArray(payload.candidates)
        ? mapResultCandidates(payload.candidates)
        : [];
      return {
        success: true,
        data: {
          ...basePayload,
          title: payload.title || basePayload.title,
          totalVotes: payload.totalVotes || 0,
          candidates,
          showProgress: false,
          candidateCount: candidateCount || candidates.length,
        },
      };
    }
  }

  const totalVotes = await resolveTotals();
  return {
    success: true,
    data: {
      ...basePayload,
      totalVotes,
      candidates: [],
      showProgress: !isClosed && includeLiveForOpen,
    },
  };
};

export const loginUser = async (email, password) => {
  return request('/voters/login', {
    method: 'POST',
    data: { email, password },
    skipAuthRefresh: true,
  });
};

export const refreshSession = async () => {
  return request('/voters/refresh', {
    method: 'POST',
    skipAuthRefresh: true,
  });
};

export const logoutUser = async () => {
  return request('/voters/logout', {
    method: 'POST',
    skipAuthRefresh: true,
  });
};

export const requestOtp = async ({ email, purpose }) => {
  return request('/voters/request-otp', {
    method: 'POST',
    data: { email, purpose },
    skipAuthRefresh: true,
  });
};

export const verifyOtp = async ({ email, otp, purpose }) => {
  return request('/voters/verify-otp', {
    method: 'POST',
    data: { email, otp, purpose },
    skipAuthRefresh: true,
  });
};

export const resetPassword = async ({
  email,
  otp,
  password,
  passwordConfirm,
}) => {
  return request('/voters/reset-password', {
    method: 'POST',
    data: { email, otp, password, passwordConfirm },
    skipAuthRefresh: true,
  });
};

export const registerUser = async (newUser) => {
  const payload = {
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    password: newUser.password,
    passwordConfirm: newUser.passwordConfirm || newUser.password2,
  };

  return request('/voters/register', {
    method: 'POST',
    data: payload,
    skipAuthRefresh: true,
  });
};
