export const authFetch = async (url, options = {}) => {
  const userInfo = JSON.parse(localStorage.getItem("userInfo"));
  const token = userInfo?.token;

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    alert("Session expired or unauthorized. Please login again.");
    localStorage.removeItem("userInfo");
    window.location.href = "/login";
    return { res: null, data: null };
  }

  const data = await res.json();
  return { res, data };
};
