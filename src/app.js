import {pre, span, div, h1, button} from '@cycle/dom'
import xs from 'xstream'

export function App (sources) {
  const totalClicks$ = sources.DOM.select('button').events('click')
    .mapTo(1)
    .fold((clicks, increment) => clicks + increment, 0)

  const userRes$ = sources.HTTP.select('user').flatten()
    .map((res) => res.body)
    .startWith(null)

  const clicksVDom = (totalClicks) => (
    div([
      h1(`Total clicks: ${totalClicks}`),
      button('Click me!')
    ])
  )
  const userVDom = (userRes) => {
    if (!userRes) {
      return span('loading')
    }
    return pre(JSON.stringify(userRes, null, 4))
  }
  const vtree$ = xs.combine(totalClicks$, userRes$)
    .map(([totalClicks, userRes]) =>
      div([
        clicksVDom(totalClicks),
        userVDom(userRes)
      ])
    )
  const makeRandomUserId = () => Math.floor(Math.random() * 9 + 1)
  const userReq$ = xs.periodic(5000)
    .map(() => makeRandomUserId())
    .fold((prevId, nextId) => {
      if (nextId !== prevId) {
        return nextId
      }
      return nextId > 0 ? nextId - 1 : nextId + 1
    }, 1)
    .map((userId) => ({
      url: `http://jsonplaceholder.typicode.com/users/${userId}`,
      category: 'user'
    }))
  const sinks = {
    DOM: vtree$,
    HTTP: userReq$
  }
  return sinks
}
