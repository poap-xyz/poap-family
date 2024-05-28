import PropTypes from 'prop-types'
import { createContext, useCallback, useContext, useMemo } from 'react'
import { createInstance } from 'matomo-react'

const matomoHost = process.env.REACT_APP_MATOMO_HOST
const matomoSiteId = process.env.REACT_APP_MATOMO_SITE_ID
  ? parseInt(process.env.REACT_APP_MATOMO_SITE_ID)
  : undefined

const matomo = matomoHost && matomoSiteId
  ? createInstance({
    siteId: matomoSiteId,
    urlBase: `https://${matomoHost}`,
    srcUrl: `https://cdn.matomo.cloud/${matomoHost}/matomo.js`,
    disabled: false,
    linkTracking: false,
    configurations: {
      disableCookies: true,
    },
  })
  : undefined

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
export function AnalyticsProvider({ children }) {
  const trackLink = useCallback(
    /**
     * @param {{ href: string; linkType: 'download' | 'link' }} params
     */
    (params) => {
      if (matomo) {
        matomo.trackLink({
          href: params.href,
          linkType: params.linkType,
        })
      }
    },
    []
  )

  const trackSiteSearch = useCallback(
    /**
     * @param {{ category: string; keyword: string; count: number }} params
     */
    (params) => {
      if (matomo) {
        matomo.trackSiteSearch({
          category: params.category,
          keyword: params.keyword,
          count: params.count,
        })
      }
    },
    []
  )

  const trackPageView = useCallback(
    /**
     * @param {{ href: string; documentTitle: string }} params
     */
    (params) => {
      if (matomo) {
        matomo.trackPageView({
          href: params.href,
          documentTitle: params.documentTitle,
        })
      }
    },
    []
  )

  const enableLinkTracking = useCallback(
    () => {
      if (matomo) {
        matomo.enableLinkTracking(true)
      }
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
}
