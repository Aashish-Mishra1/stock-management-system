import { baseApi } from "../baseApi";

const saleApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSale: builder.query({
      query: (query) => ({
  url: '/sales',
        method: 'GET',
        params: query
      }),
      transformResponse: (response: any) => {
        const result = response?.data ?? {};
        const data = result?.sales ?? result ?? [];
        const meta = {
          total: result?.total ?? 0,
          page: result?.page ?? 1,
          totalPages: result?.totalPages ?? 1,
        };
        return { ...response, data, meta };
      },
      providesTags: ['sale']
    }),
    createSale: builder.mutation({
      query: (payload) => ({
  url: '/sales',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['sale', 'product']
    }),
    deleteSale: builder.mutation({
      query: (id) => ({
  url: `/sales/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['sale']
    }),
    updateSale: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/sales/${id}`,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['sale']
    }),
    yearlySale: builder.query({
      query: () => ({
  url: `/sales/years`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const data = response?.data ?? [];
        return { ...response, data };
      },
      providesTags: ['sale']
    }),
    monthlySale: builder.query({
      query: () => ({
  url: `/sales/months`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const data = response?.data ?? [];
        return { ...response, data };
      },
      providesTags: ['sale']
    }),
    weeklySale: builder.query({
      query: () => ({
  url: `/sales/weeks`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const data = response?.data ?? [];
        return { ...response, data };
      },
      providesTags: ['sale']
    }),
    dailySale: builder.query({
      query: () => ({
  url: `/sales/days`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const data = response?.data ?? [];
        return { ...response, data };
      },
      providesTags: ['sale']
    }),
  })
})

export const {
  useGetAllSaleQuery,
  useCreateSaleMutation,
  useDeleteSaleMutation,
  useUpdateSaleMutation,
  useYearlySaleQuery,
  useMonthlySaleQuery,
  useWeeklySaleQuery,
  useDailySaleQuery } = saleApi