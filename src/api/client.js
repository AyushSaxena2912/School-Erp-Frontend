const API_URL = import.meta.env.VITE_API_URL || "";

async function request(method, url, body) {
  const response = await fetch(`${API_URL}${url}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?._error_message || "Request failed"
    );
    error.response = { data, status: response.status };
    throw error;
  }

  return { data };
}

const api = {
  post: (url, body) => request("POST", url, body),
  get: (url) => request("GET", url),
};

export default api;
