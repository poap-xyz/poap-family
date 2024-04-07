import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Root from './Root'
import CenterPage from '../components/CenterPage'
import Loading from '../components/Loading'
import Home from '../pages/Home'
import Event from '../pages/Event'
import Events from '../pages/Events'
import PageError from '../components/PageError'
import EventsPageError from '../components/EventsPageError'
import { eventLoader, eventsLoader } from '../loaders/event'
import Last from '../pages/Last'
import Settings from '../pages/Settings'
import FeedbackList from '../pages/FeedbackList'
import Analytics from './Analytics'
import Admin from './Admin'
import Addresses from '../pages/Addresses'
import { AdminProvider } from '../stores/admin'
import { SettingsProvider } from '../stores/cache'
import { EnsProvider } from '../stores/ethereum'
import { HTMLProvider } from '../stores/html'
import '../styles/fonts.css'
import '../styles/app.css'

function App() {
  return (
    <main className="app">
      <HTMLProvider>
        <Analytics>
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
        </Analytics>
      </HTMLProvider>
    </main>
  )
}

export default App
