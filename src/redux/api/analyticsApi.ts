import { apiSlice } from "./apiSlice";

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalyticsOverview: builder.query({
      query: () => "/analytics/overview",
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsOverviewQuery } = analyticsApi;
