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
  useGetCandidateTestsQuery,
} = candidatesApi;
