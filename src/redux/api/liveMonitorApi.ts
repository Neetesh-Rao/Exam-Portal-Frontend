import { apiSlice } from "./apiSlice";

export const liveMonitorApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLiveMonitorSessions: builder.query({
      query: () => "/live-monitor",
      providesTags: ["LiveMonitor"],
    }),
  }),
});

export const { useGetLiveMonitorSessionsQuery } = liveMonitorApi;
