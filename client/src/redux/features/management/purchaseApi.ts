import { baseApi } from "../baseApi";

const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllPurchases: builder.query({
      query: (query) => ({
        url: '/purchases',
        method: 'GET',
        params: query
      }),
      transformResponse: (response: any) => {
        const result = response?.data ?? {};
        const data = result?.purchases ?? result ?? [];
        const meta = {
          total: result?.total ?? 0,
          page: result?.page ?? 1,
          totalPages: result?.totalPages ?? 1,
        };
        return { ...response, data, meta };
      },
      providesTags: ['purchases']
    }),

    createPurchase: builder.mutation({
      query: (payload) => ({
        url: '/purchases',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['purchases']
    }),

    updatePurchase: builder.mutation({
      query: ({ id, payload }) => ({
        url: '/purchases/' + id,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['purchases']
    }),

    deletePurchase: builder.mutation({
      query: (id) => ({
        url: '/purchases/' + id,
        method: 'DELETE',
      }),
      invalidatesTags: ['purchases']
    }),
  })
})

export const { useGetAllPurchasesQuery, useCreatePurchaseMutation, useUpdatePurchaseMutation, useDeletePurchaseMutation } = purchaseApi