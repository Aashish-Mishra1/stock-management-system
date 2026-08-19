import { baseApi } from "../baseApi";

const categoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query({
      query: () => ({
        url: '/categories/all',
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const items = response?.data?.categories ?? response?.data ?? [];
        const data = Array.isArray(items)
          ? items.map((it: any) => ({ ...it, _id: it.id ?? it._id }))
          : [];
        return { ...response, data };
      },
      providesTags: ['category']
    }),
    createCategory: builder.mutation({
      query: (payload) => ({
  url: '/categories',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['category']
    }),
  })
})

export const { useGetAllCategoriesQuery, useCreateCategoryMutation } = categoryApi