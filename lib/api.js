import axios from 'axios'
import debounce from 'lodash.debounce'
import ms from 'ms'

import { fileToDataURL } from './util'
import firebase from './client'
import { DEFAULT_CODE } from './constants'

export const client = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_API_URL || ''}/api`,
  headers: {
    Accept: 'application/json',
  },
})

const downloadThumbnailImage = img => {
  return client
    .get(img.url.replace('http://', 'https://'), { responseType: 'blob' })
    .then(res => res.data)
    .then(fileToDataURL)
    .then(dataURL => Object.assign(img, { dataURL }))
}

const unsplash = {
  download(id) {
    return client.get(`/unsplash/download/${id}`).then(res => res.data)
  },
  async random() {
    const imageUrls = await client.get('/unsplash/random')
    return Promise.all(imageUrls.data.map(downloadThumbnailImage))
  },
}

function getSnippet(uid = '', { host, filename } = {}) {
  return client
    .get(`/snippets/${uid}`, {
      baseURL: host ? `https://${host}/api` : undefined,
      params: { filename },
    })
    .then(res => res.data)
    .catch(e => {
      console.error(e)
      return null
    })
}

function listSnippets(page) {
  // IDEA: move into axios interceptor
  return firebase
    .auth()
    .currentUser.getIdToken()
    .then(authorization =>
      client
        .get(`/snippets`, {
          params: {
            page,
          },
          headers: {
            authorization,
          },
        })
        .then(res => res.data)
        .catch(e => {
          console.error(e)
          throw e
        })
    )
}

function updateSnippet(uid, state) {
  const data = {
    ...state,
    code: state.code != null ? state.code : DEFAULT_CODE,
  }

  if (uid) {
    return client
      .patch(`/snippets/${uid}`, data)
      .then(res => res.data)
      .catch(e => {
        console.error(e)
        return null
      })
  }
  return client
    .post(`/snippets`, data)
    .then(res => res.data)
    .catch(e => {
      console.error(e)
      return null
    })
}

function deleteSnippet(uid) {
  return client
    .delete(`/snippets/${uid}`)
    .then(res => res.data)
    .catch(e => {
      console.error(e)
      return null
    })
}

const createSnippet = debounce(data => updateSnippet(null, data), ms('5s'), {
  leading: true,
  trailing: false,
})

const api = {
  snippet: {
    get: getSnippet,
    list: listSnippets,
    update: debounce(updateSnippet, ms('1s'), { leading: true, trailing: true }),
    create: createSnippet,
    delete: id => deleteSnippet(id),
  },
  unsplash,
  downloadThumbnailImage,
}

export default api
