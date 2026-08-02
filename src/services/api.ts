const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_RETRIES = 3;
const RETRY_STATUS_CODES = [502, 503, 504];

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
) => {
  const auth = localStorage.getItem("auth");
  const token = auth ? JSON.parse(auth).token : null;

  let lastError: any;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        cache: "no-store",
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...options.headers,
        },
      });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
      }

      if (!response.ok) {
        const error = new ApiError(
          data?.message || "Something went wrong",
          response.status,
          data
        );

        if (
          RETRY_STATUS_CODES.includes(response.status) &&
          attempt < MAX_RETRIES
        ) {
          await sleep(300 * Math.pow(2, attempt - 1));
          continue;
        }

        throw error;
      }

      return data;
    } catch (error: any) {
      lastError = error;

      const isNetworkError =
        error instanceof TypeError ||
        error?.name === "AbortError";

      if (isNetworkError && attempt < MAX_RETRIES) {
        await sleep(300 * Math.pow(2, attempt - 1));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};