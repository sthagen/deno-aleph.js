import type { CSSProperties } from 'https://esm.sh/react'
import { Component, createElement } from 'https://esm.sh/react'

export class ErrorBoundary extends Component {
  state: { error: Error | null, promise: Promise<any> | null }

  constructor(props: any) {
    super(props)
    this.state = { error: null, promise: null }
  }

  static getDerivedStateFromError(e: any) {
    if (e instanceof Promise) {
      return { error: null, promise: e }
    }
    return { error: e, promise: null }
  }

  componentDidCatch(e: any) {
    if (e instanceof Promise) {
      e.then(() => {
        this.setState({ promise: null })
      })
    } else {
      console.error(e)
    }
  }

  render() {
    const { error, promise } = this.state

    if (error) {
      return (
        createElement(
          'pre',
          null,
          error.stack || error.message || error.toString()
        )
      )
    }

    if (promise) {
      return null
    }

    return this.props.children
  }
}

export function E404Page() {
  return createElement(
    StatusError,
    {
      status: 404,
      message: 'Page Not Found'
    }
  )
}

export function E400MissingComponent({ name }: { name: string }) {
  return createElement(
    StatusError,
    {
      status: 400,
      message: `Module "${name}" should export a React Component as default`,
      showRefreshButton: true
    }
  )
}

const resetStyle: CSSProperties = {
  padding: 0,
  margin: 0,
  lineHeight: 1.5,
  fontSize: 15,
  fontWeight: 400,
  color: '#333',
}

export function StatusError({ status, message }: { status: number, message: string }) {
  return (
    createElement(
      'div',
      {
        style: {
          ...resetStyle,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          width: '100vm',
          height: '100vh',
        }
      },
      createElement(
        'p',
        {
          style: {
            ...resetStyle,
            fontWeight: 500,
          }
        },
        createElement(
          'code',
          {
            style: {
              ...resetStyle,
              fontWeight: 700,
            }
          },
          status
        ),
        createElement(
          'small',
          {
            style: {
              ...resetStyle,
              fontSize: 14,
              color: '#999'
            }
          },
          ' - '
        ),
        createElement(
          'span',
          null,
          message
        )
      )
    )
  )
}

export class AsyncUseDenoError extends Error { }
