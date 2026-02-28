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

export const apiFetch = async (
  path: string,
  options: RequestInit = {}
) => {
  const auth = localStorage.getItem("auth");
  const token = auth ? JSON.parse(auth).token : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new ApiError(
      data?.message || "Something went wrong",
      res.status,
      data
    );
  }

  return data;
};