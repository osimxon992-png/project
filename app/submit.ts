import { startTransition, type FormEvent } from 'react'

// <form action> resets fields after every submit in React 19, which wipes input when the server returns an error.
export const keepValues = (dispatch: (fd: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const fd = new FormData(e.currentTarget)
  startTransition(() => dispatch(fd))
}
