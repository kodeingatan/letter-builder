import { ref, computed, watch } from 'vue'
import { useApi } from '~/composables/useApi'
import type { EvalContext } from '~~/server/utils/expressions'
import { extractRefs, validate } from '~~/server/utils/expressions'

export function useExpressionPreview() {
  const api = useApi()

  const expression = ref<string>('')
  const context = ref<EvalContext>({})

  const result = ref<{ value: unknown; error?: string } | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  const refs = computed(() => {
    return extractRefs(expression.value)
  })

  const validateResult = computed(() => {
    return validate(expression.value, context.value)
  })

  const evaluateExpression = async (expr?: string) => {
    const exprToEval = expr || expression.value
    loading.value = true
    error.value = null

    try {
      const response = await api.post('/expressions/evaluate', {
        expression: exprToEval,
        context: context.value,
      })
      result.value = response.data
      error.value = null
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Evaluation failed'
      result.value = null
    } finally {
      loading.value = false
    }
  }

  const validateExpression = async (expr?: string) => {
    const exprToValidate = expr || expression.value
    try {
      const response = await api.post('/expressions/validate', {
        expression: exprToValidate,
        sampleContext: context.value,
      })
      return response.data
    } catch (e: any) {
      return {
        valid: false,
        refs: extractRefs(exprToValidate),
        error: e?.response?.data?.message || e?.message || 'Validation failed',
      }
    }
  }

  const reset = () => {
    result.value = null
    error.value = null
  }

  watch([expression, context], reset, { deep: true })

  return {
    expression,
    context,
    result,
    error,
    loading,
    refs,
    validateResult,
    evaluateExpression,
    validateExpression,
    reset,
  }
}