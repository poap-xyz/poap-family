import PropTypes from 'prop-types'
import { createInstance, MatomoProvider } from '@datapunt/matomo-tracker-react'

const matomoHost = process.env.REACT_APP_MATOMO_HOST
const matomoSiteId = parseInt(process.env.REACT_APP_MATOMO_SITE_ID)

const matomo = matomoHost
  ? createInstance({
    siteId: matomoSiteId,
    urlBase: `https://${matomoHost}`,
    srcUrl: `https://cdn.matomo.cloud/${matomoHost}/matomo.js`,
    disabled: false,
    linkTracking: true,
    configurations: {
      disableCookies: true,
    },
  })
  : undefined

/**
 * @param {PropTypes.InferProps<AnalyticsProvider.propTypes>} props
 */
export function AnalyticsProvider({ children }) {
  if (!matomo) {
    return children
  }

  return (
    <MatomoProvider value={matomo}>
      {children}
    </MatomoProvider>
  )
}

AnalyticsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
