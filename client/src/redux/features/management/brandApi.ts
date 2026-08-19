import { baseApi } from "../baseApi";

const brandApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllBrands: builder.query({
      query: () => ({
        url: '/brands/all',
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const items = response?.data?.brands ?? response?.data ?? [];
        const data = Array.isArray(items)
          ? items.map((it: any) => ({ ...it, _id: it.id ?? it._id }))
          : [];
        return { ...response, data };
      },
      providesTags: ['brand']
    }),
    createBrand: builder.mutation({
      query: (payload) => ({
        url: '/brands',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['brand']
    }),
  })
})

export const { useGetAllBrandsQuery, useCreateBrandMutation } = brandApi