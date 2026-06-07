'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'

interface Props {
  children: ReactNode
  fallbackMessage?: string
}

interface State {
  hasError: boolean
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[MapErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <EmptyState message={this.props.fallbackMessage ?? 'Unable to load map'} />
      )
    }
    return this.props.children
  }
}
