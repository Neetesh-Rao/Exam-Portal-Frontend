import { apiSlice } from "./apiSlice";

export const candidatesApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getCandidates: builder.query({
      query: () => "/candidates",
      providesTags: ["Candidate"],
    }),
    getCandidateById: builder.query({
      query: (id) => `/candidates/${id}`,
      providesTags: (result, error, id) => [{ type: "Candidate", id }],
    }),
    createCandidate: builder.mutation({
      query: (body) => ({
        url: "/candidates",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Candidate", "Analytics"],
    }),
    updateCandidate: builder.mutation({
      query: ({ id, ...body }: { id: string; [key: string]: any }) => ({
        url: `/candidates/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Candidate", id }, "Candidate", "Analytics"],
    }),
    deleteCandidate: builder.mutation({
      query: (id: string) => ({
        url: `/candidates/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Candidate", "Analytics"],
    }),
    getCandidateTests: builder.query({
      query: () => "/candidate/tests",
      providesTags: ["Invite"],
    }),
  }),
});

export const {
  useGetCandidatesQuery,
  useGetCandidateByIdQuery,
  useCreateCandidateMutation,
  useUpdateCandidateMutation,
  useDeleteCandidateMutation,
  useGetCandidateTestsQuery,
} = candidatesApi;
