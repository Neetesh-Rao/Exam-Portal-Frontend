import { apiSlice } from "./apiSlice";

export const testsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTests: builder.query({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params?.status) searchParams.append("status", params.status);
        if (params?.search) searchParams.append("search", params.search);
        const queryStr = searchParams.toString();
        return `/tests${queryStr ? `?${queryStr}` : ""}`;
      },
      providesTags: ["Test"],
    }),
    getTestById: builder.query({
      query: (id) => `/tests/${id}`,
      providesTags: (result, error, id) => [{ type: "Test", id }],
    }),
    createTest: builder.mutation({
      query: (body) => ({
        url: "/tests",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Test", "Analytics"],
    }),
    updateTest: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/tests/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { id }) => ["Test", { type: "Test", id }],
    }),
    deleteTest: builder.mutation({
      query: (id) => ({
        url: `/tests/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Test", "Analytics"],
    }),
    publishTest: builder.mutation({
      query: (id) => ({
        url: `/tests/${id}/publish`,
        method: "POST",
      }),
      invalidatesTags: (result, error, id) => ["Test", { type: "Test", id }],
    }),
  }),
});

export const {
  useGetTestsQuery,
  useGetTestByIdQuery,
  useCreateTestMutation,
  useUpdateTestMutation,
  useDeleteTestMutation,
  usePublishTestMutation,
} = testsApi;
