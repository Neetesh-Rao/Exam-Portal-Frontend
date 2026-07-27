import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api",
    credentials: "include",
  }),
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
