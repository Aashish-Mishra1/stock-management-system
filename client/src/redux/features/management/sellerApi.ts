import { baseApi } from "../baseApi";

const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSeller: builder.query({
      query: (query) => ({
        url: '/sellers',
        method: 'GET',
        params: query
      }),
      transformResponse: (response: any) => {
        const items = response?.data?.sellers ?? response?.data ?? [];
        const data = Array.isArray(items)
          ? items.map((it: any) => ({ ...it, _id: it.id ?? it._id }))
          : [];
        const meta = response?.data && !Array.isArray(response.data)
          ? { total: response.data.total, page: response.data.page, totalPages: response.data.totalPages }
          : response?.meta ?? {};
        return { ...response, data, meta };
      },
      providesTags: ['seller']
    }),
    getAllSellerList: builder.query({
      query: () => ({
        url: '/sellers/all',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        const items = response?.data?.sellers ?? response?.data ?? [];
        const data = Array.isArray(items)
          ? items.map((it: any) => ({ ...it, _id: it.id ?? it._id }))
          : [];
        return { ...response, data };
      },
      providesTags: ['seller']
    }),
    createSeller: builder.mutation({
      query: (payload) => ({
        url: '/sellers',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['seller']
    }),
    updateSeller: builder.mutation({
      query: ({ id, payload }) => ({
        url: '/sellers/' + id,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['seller']
    }),
    deleteSeller: builder.mutation({
      query: (id) => ({
        url: '/sellers/' + id,
        method: 'DELETE'
      }),
      invalidatesTags: ['seller']
    }),
  })
})

export const { useGetAllSellerQuery, useGetAllSellerListQuery, useCreateSellerMutation, useUpdateSellerMutation, useDeleteSellerMutation } = sellerApi