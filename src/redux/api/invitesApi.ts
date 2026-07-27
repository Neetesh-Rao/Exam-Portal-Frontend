import { apiSlice } from "./apiSlice";

export const invitesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInvites: builder.query({
      query: () => "/invites",
      providesTags: ["Invite"],
    }),
    sendBulkInvites: builder.mutation({
      query: (body) => ({
        url: "/invites/bulk",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Invite", "Candidate"],
    }),
    validateInvite: builder.query({
      query: (token) => `/invites/${token}/validate`,
      providesTags: (result, error, token) => [{ type: "Invite", id: token }],
    }),
  }),
});

export const {
  useGetInvitesQuery,
  useSendBulkInvitesMutation,
  useValidateInviteQuery,
} = invitesApi;
