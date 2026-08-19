import { baseApi } from "./baseApi";

const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (payload) => ({
        url: '/auth/login',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    register: builder.mutation({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    getSelfProfile: builder.query({
      query: () => ({
        url: '/auth/profile',
        method: 'GET',
      }),
      transformResponse: (response: any) => {
        // backend returns { success: true, data: { user: { ... } } }
        const user = response?.data?.user ?? response?.data ?? null;
        return { ...response, data: user };
      },
      providesTags: ['user']
    }),

    changePassword: builder.mutation({
      query: (payload) => ({
        url: '/auth/change-password',
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

    updateProfile: builder.mutation({
      query: (payload) => ({
        url: '/auth/profile',
        method: 'PUT',
        body: payload
      }),
      invalidatesTags: ['user']
    }),

  })
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetSelfProfileQuery,
  useChangePasswordMutation,
  useUpdateProfileMutation
} = authApi