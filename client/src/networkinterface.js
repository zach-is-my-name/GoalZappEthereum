/* eslint-disable */
// import {createNetworkInterface} from 'apollo-client'
import {createHttpLink} from 'apollo-link-http'
import {setContext} from 'apollo-link-context'

const userExistsCallback = () => console.log("user Exists")
const userDoesntExistCallback = () => console.log("user Doesn't Exist")
//redirect to login or signup page

// const customFetch =  fetch("https://api.8base.com/ckbx087zh000207ms3ink870q", {
//   method: "POST",
//   headers: {
//     "Content-Type": "application/json",
//   //  Authorization: `Bearer ${localStorage.getItem('auth0IdToken')}`
//   },
//   //body: JSON.stringify({ query: "{ user { id } }" })
// })


// export const httpLink  = createHttpLink({
//   uri: 'https://api.8base.com/ckbx087zh000207ms3ink870q', fetch: customFetch
// })

// const middlewareLink = setContext(() => ({
//   headers: {
//     authorization: `Bearer ${localStorage.getItem('auth0IdToken') || localStorage.getItem('graphcoolToken')}` ||  null
//   }
// }))

// export const link = httpLink


export const httpLink  = createHttpLink({
  uri: 'https://api.8base.com/ckbx087zh000207ms3ink870q'
})

// const middlewareLink = setContext(() => ({
//   headers: {
//     // authorization: `Bearer ${localStorage.getItem('auth0IdToken')}` || `Bearer ${localStorage.getItem('graphcoolToken')}` || null
//     authorization: `Bearer ${localStorage.getItem('auth0IdToken') || localStorage.getItem('graphcoolToken')}` ||  null
//   }
// }))



// const link = middlewareLink.concat(httpLink)
// console.log(link)
// export link
// networkInterface.use([{
//   applyMiddleware (req, next) {
//     if (!req.options.headers) {
//       req.options.headers = {}
//     }
//
//     // get the authentication token from local storage if it exists
//     if (localStorage.getItem('auth0IdToken')) {
//       req.options.headers.authorization = `Bearer ${localStorage.getItem('auth0IdToken')}`
//       // console.log('Request Headers:', req.options.headers.authorization)
//     }
//     next()
//   },
// }])
//
