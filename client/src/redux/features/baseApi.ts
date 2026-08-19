import { BaseQueryApi, BaseQueryFn, DefinitionType, FetchArgs, createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { config } from "../../utils/config";
import { logoutUser } from "../services/authSlice";
import { RootState } from "../store";

const baseQuery = fetchBaseQuery({
  baseUrl: config.baseUrl,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token

    let authToken = token;
    // Fallback: try to read persisted token from localStorage (redux-persist)
    if (!authToken) {
      try {
        const raw = localStorage.getItem('persist:auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          // parsed may store token as string or JSON string
          authToken = parsed?.token ?? (typeof parsed === 'string' ? JSON.parse(parsed)?.token : undefined);
        }
      } catch (e) {
        // ignore
      }
      // also support a plain `token` key if present
      if (!authToken) authToken = localStorage.getItem('token') ?? undefined;
    }

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`)
    }

    return headers
  }
})

const customBaseQuery: BaseQueryFn<FetchArgs, BaseQueryApi, DefinitionType> = async (args, api, extraOptions): Promise<any> => {
  const result = await baseQuery(args, api, extraOptions)

  if (result?.error?.status === 401) {
    window.location.href = '/login'
    api.dispatch(logoutUser())
  }

  return result
}


export const baseApi = createApi({
  reducerPath: 'baseApi',
  baseQuery: customBaseQuery,
  tagTypes: ['product', 'sale', 'user', 'category', 'brand', 'seller', 'purchases'],
  endpoints: () => ({})
})