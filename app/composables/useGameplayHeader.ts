export interface GameplayHeaderDetail {
  label: string
  value: string
}

export interface GameplayHeaderContext {
  routePath: string
  title: string
  details: GameplayHeaderDetail[]
}

export function useGameplayHeader() {
  const context = useState<GameplayHeaderContext | null>('gameplay-header-context', () => null)

  function set(value: GameplayHeaderContext) {
    context.value = value
  }

  function clear(routePath: string) {
    if (context.value?.routePath === routePath) context.value = null
  }

  return { context, set, clear }
}
