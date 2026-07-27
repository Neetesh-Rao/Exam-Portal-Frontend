import { apiSlice } from "./apiSlice";

export const notificationsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: () => "/notifications",
      providesTags: ["Notification"],
    }),
  }),
});

export const { useGetNotificationsQuery } = notificationsApi;
