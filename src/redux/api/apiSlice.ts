import { createApi, fetchBaseQuery, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs } from "@reduxjs/toolkit/query";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : "/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  credentials: "include",
  prepareHeaders: (headers) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
    }
    return headers;
  },
});

// Auto-refresh: on 401, try to refresh the token once then retry
const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    // Attempt to refresh the access token
    const refreshResult = await rawBaseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    const refreshData = refreshResult.data as any;
    if (refreshData?.accessToken || refreshData?.token) {
      const newToken = refreshData.accessToken || refreshData.token;
      if (typeof window !== "undefined") {
        localStorage.setItem("token", newToken);
      }
      // Retry the original query with the new token
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      // Refresh failed — clear token and let the app handle redirect
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
      }
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "User",
    "Test",
    "Question",
    "Submission",
    "Candidate",
    "Invite",
    "Analytics",
    "Notification",
    "LiveMonitor",
  ],
  endpoints: () => ({}),
});
