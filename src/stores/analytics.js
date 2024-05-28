import PropTypes from 'prop-types'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'

const MATOMO_HOST = process.env.REACT_APP_MATOMO_HOST
const MATOMO_SITE_ID = process.env.REACT_APP_MATOMO_SITE_ID
  ? parseInt(process.env.REACT_APP_MATOMO_SITE_ID)
  : undefined

/**
 * @param {ReadonlyArray<string | number | boolean>} values
 */
function push(values) {
  if ('_paq' in window) {
    console.debug(values)
    // @ts-ignore
    window._paq.push(values)
  }
}

/**
 * @param {string} host
 * @param {number} siteId
 */
function load(host, siteId) {
  if ('_paq' in window) {
    return
  }

  console.debug('loading analytics')

  let tracker = document.createElement('script')
  tracker.type = 'text/javascript'
  tracker.src = `https://cdn.matomo.cloud/${host}/matomo.js`
  tracker.async = true
  tracker.defer = true

  // @ts-ignore
  window._paq = []

  push(['setTrackerUrl', `https://${host}/matomo.php`])
  push(['setSiteId', siteId])

  const firstScript = document.getElementsByTagName('script')[0]
  firstScript.parentNode.insertBefore(tracker, firstScript)
}

const AnalyticsContext = createContext({
  trackLink:
    /**
     * @param {{ href: string; linkType: 'download' | 'link' }} params
     */
    (params) => {},
  trackSiteSearch:
    /**
     * @param {{ category: string; keyword: string; count: number }} params
     */
    (params) => {},
  trackPageView:
    /**
     * @param {{ href: string; documentTitle: string }} params
     */
    (params) => {},
  enableLinkTracking: () => {},
})

export const useAnalytics = () => useContext(AnalyticsContext)

/**
 * @param {PropTypes.InferProps<AnalyticsProvider.propTypes>} props
 */
export function AnalyticsProvider({
  children,
  matomoHost = MATOMO_HOST,
  matomoSiteId = MATOMO_SITE_ID,
}) {
  useEffect(
    () => {
      if (matomoHost && matomoSiteId) {
        load(matomoHost, matomoSiteId)
      }

      push(['disableCookies', true])
      push(['enableHeartBeatTimer', 15])
    },
    [] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const trackLink = useCallback(
    /**
     * @param {{ href: string; linkType: 'download' | 'link' }} params
     */
    (params) => {
      push(['trackLink', params.href, params.linkType])
    },
    []
  )

  const trackSiteSearch = useCallback(
    /**
     * @param {{ keyword: string; category: string; count: number }} params
     */
    (params) => {
      push(['trackSiteSearch', params.keyword, params.category, params.count])
    },
    []
  )

  const trackPageView = useCallback(
    /**
     * @param {{ href: string; documentTitle: string }} params
     */
    (params) => {
      push(['setCustomUrl', params.href])
      push(['setDocumentTitle', params.documentTitle])
      push(['trackPageView'])
    },
    []
  )

  const enableLinkTracking = useCallback(
    () => {
      push(['enableLinkTracking', true])
    },
    []
  )

  const value = useMemo(() => ({
    trackLink,
    trackSiteSearch,
    trackPageView,
    enableLinkTracking,
  }), [
    trackLink,
    trackSiteSearch,
    trackPageView,
    enableLinkTracking,
  ])

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

AnalyticsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  matomoHost: PropTypes.string,
  matomoSiteId: PropTypes.number,
}
