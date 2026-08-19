import { baseApi } from "../baseApi";

const productApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (query) => ({
        url: '/products',
        method: 'GET',
        params: query
      }),
      transformResponse: (response: any) => {
        // Backend returns { success: true, data: { products: [...], total, page, totalPages } }
        const result = response?.data ?? {};
        const data = result?.products ?? result ?? [];
        const meta = {
          total: result?.total ?? 0,
          page: result?.page ?? 1,
          totalPages: result?.totalPages ?? 1,
        };
        return { ...response, data, meta };
      },
      providesTags: ['product']
    }),
    countProducts: builder.query({
      query: () => ({
        url: '/products/total',
        method: 'GET',
      }),
      providesTags: ['product']
    }),
    getSingleProduct: builder.query({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'GET'
      }),
      providesTags: ['product']
    }),
    createNewProduct: builder.mutation({
      query: (payload) => ({
        url: '/products',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['product']
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product']
    }),
    updateProduct: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/${id}`,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
    createVariant: builder.mutation({
      query: (payload) => ({
        url: '/products/variants',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
    getProductVariants: builder.query({
      query: (productId) => ({
        url: `/products/${productId}/variants`,
        method: 'GET'
      }),
      transformResponse: (response: any) => {
        const result = response?.data ?? {};
        const data = result?.variants ?? result ?? [];
        return { ...response, data };
      },
      providesTags: ['product']
    }),
    updateVariant: builder.mutation({
      query: ({ id, payload }) => ({
        url: `/products/variants/${id}`,
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['product']
    }),
    deleteVariant: builder.mutation({
      query: (id) => ({
        url: `/products/variants/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['product']
    }),
  })
})

export const {
  useGetAllProductsQuery,
  useCountProductsQuery,
  useCreateNewProductMutation,
  useDeleteProductMutation,
  useGetSingleProductQuery,
  useUpdateProductMutation,
  useCreateVariantMutation,
  useUpdateVariantMutation,
  useDeleteVariantMutation,
  useGetProductVariantsQuery,
} = productApi