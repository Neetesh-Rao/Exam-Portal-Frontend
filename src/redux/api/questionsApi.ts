import { apiSlice } from "./apiSlice";

export const questionsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getQuestions: builder.query({
      query: (search) => {
        return `/questions${search ? `?search=${encodeURIComponent(search)}` : ""}`;
      },
      providesTags: ["Question"],
    }),
    getQuestionById: builder.query({
      query: (id) => `/questions/${id}`,
      providesTags: (result, error, id) => [{ type: "Question", id }],
    }),
    createQuestion: builder.mutation({
      query: (body) => ({
        url: "/questions",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Question"],
    }),
    updateQuestion: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/questions/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["Question", { type: "Question", id }],
    }),
    deleteQuestion: builder.mutation({
      query: (id) => ({
        url: `/questions/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Question"],
    }),
  }),
});

export const {
  useGetQuestionsQuery,
  useGetQuestionByIdQuery,
  useCreateQuestionMutation,
  useUpdateQuestionMutation,
  useDeleteQuestionMutation,
} = questionsApi;
