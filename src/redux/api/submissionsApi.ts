import { apiSlice } from "./apiSlice";

export const submissionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSubmissions: builder.query({
      query: () => "/submissions",
      providesTags: ["Submission"],
    }),
    startSubmission: builder.mutation({
      query: (body) => ({
        url: "/submissions/start",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Submission", "Invite"],
    }),
    getSubmissionById: builder.query({
      query: (id) => `/submissions/${id}`,
      providesTags: (result, error, id) => [{ type: "Submission", id }],
    }),
    saveAnswer: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/submissions/${id}/answer`,
        method: "PATCH",
        body,
      }),
    }),
    gradeSubmission: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/submissions/${id}/grade`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["Submission", { type: "Submission", id }, "Analytics"],
    }),
    logViolation: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/submissions/${id}/violation`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["LiveMonitor"],
    }),
    uploadWebcamSnapshot: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/submissions/${id}/webcam-snapshot`,
        method: "POST",
        body,
      }),
    }),
    submitTest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/submissions/${id}/submit`,
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["Submission", { type: "Submission", id }, "Invite", "Analytics"],
    }),
  }),
});

export const {
  useGetSubmissionsQuery,
  useStartSubmissionMutation,
  useGetSubmissionByIdQuery,
  useSaveAnswerMutation,
  useGradeSubmissionMutation,
  useLogViolationMutation,
  useUploadWebcamSnapshotMutation,
  useSubmitTestMutation,
} = submissionsApi;
