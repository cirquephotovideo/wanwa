import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Tables = Database['public']['Tables']

export function useSupabaseQuery<T extends keyof Tables>(
  table: T,
  options?: {
    select?: string
    filters?: Record<string, any>
    order?: { column: string; ascending?: boolean }
    limit?: number
  }
) {
  return useQuery({
    queryKey: [table, options],
    queryFn: async () => {
      let query = supabase.from(table).select(options?.select || '*')

      // Apply filters
      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value)
        })
      }

      // Apply ordering
      if (options?.order) {
        query = query.order(options.order.column, {
          ascending: options.order.ascending ?? true,
        })
      }

      // Apply limit
      if (options?.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Tables[T]['Row'][]
    },
  })
}

export function useSupabaseMutation<T extends keyof Tables>(table: T) {
  const queryClient = useQueryClient()

  const insert = useMutation({
    mutationFn: async (data: Tables[T]['Insert']) => {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    },
  })

  const update = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Tables[T]['Update']
    }) => {
      const { data: result, error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [table] })
    },
  })

  return { insert, update, remove }
}
