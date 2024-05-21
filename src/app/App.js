import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AnalyticsProvider } from 'stores/analytics'
import { AdminProvider } from 'stores/admin'
import { SettingsProvider } from 'stores/cache'
import { EnsProvider } from 'stores/ethereum'
import { HTMLProvider } from 'stores/html'
import { eventLoader, eventsLoader } from 'loaders/event'
import Root from 'app/layout/Root'
import Admin from 'app/layout/Admin'
import Home from 'pages/Home'
import Addresses from 'pages/Addresses'
import Event from 'pages/Event'
import Events from 'pages/Events'
import Last from 'pages/Last'
import Settings from 'pages/Settings'
import FeedbackList from 'pages/FeedbackList'
import EventsPageError from 'components/EventsPageError'
import PageError from 'components/PageError'
import CenterPage from 'components/CenterPage'
import Loading from 'components/Loading'
import 'styles/fonts.css'
import 'styles/app.css'

export default function App() {
  return (
    <main className="app">
      <HTMLProvider>
        <AnalyticsProvider>
          <AdminProvider>
            <SettingsProvider>
              <EnsProvider>
                <RouterProvider
                  router={createBrowserRouter([
                    {
                      path: '/',
                      element: <Root />,
                      errorElement: <PageError />,
                      children: [
                        {
                          index: true,
                          element: <Home />,
                        },
                        {
                          path: '/event/:eventId',
                          loader: eventLoader,
                          element: <Event />,
                          errorElement: <PageError />,
                        },
                        {
                          path: '/events/:eventIds',
                          loader: eventsLoader,
                          element: <Events />,
                          errorElement: <EventsPageError />,
                        },
                        {
                          path: '/addresses',
                          element: <Addresses />,
                        },
                        {
                          path: '/last',
                          element: <Last />,
                        },
                        {
                          path: '/settings',
                          element: <Settings />,
                        },
                        {
                          element: <Admin />,
                          children: [
                            {
                              path: '/feedback',
                              element: <FeedbackList />,
                            },
                          ],
                        },
                      ],
                    },
                  ])}
                  fallbackElement={<CenterPage><Loading /></CenterPage>}
                />
              </EnsProvider>
            </SettingsProvider>
          </AdminProvider>
        </AnalyticsProvider>
      </HTMLProvider>
    </main>
  )
}
