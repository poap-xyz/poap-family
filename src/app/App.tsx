import { createBrowserRouter, replace, RouterProvider } from 'react-router-dom'
import { SettingsProvider } from 'stores/settings'
import { EnsProvider } from 'stores/ethereum'
import { HTMLProvider } from 'stores/html'
import { dropLoader, dropsLoader } from 'loaders/drops'
import Root from 'app/layout/Root'
import Home from 'pages/Home'
import Addresses from 'pages/Addresses'
import Drop from 'pages/Drop'
import Drops from 'pages/Drops'
import Last from 'pages/Last'
import DropsPageError from 'components/DropsPageError'
import PageError from 'components/PageError'
import CenterPage from 'components/CenterPage'
import Loading from 'components/Loading'
import 'styles/fonts.css'
import 'styles/app.css'

export default function App() {
  return (
    <main className="app">
      <HTMLProvider>
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
                      path: '/drop/:dropId',
                      loader: dropLoader,
                      element: <Drop />,
                      errorElement: <PageError />,
                    },
                    {
                      path: '/drops/:dropIds',
                      loader: dropsLoader,
                      element: <Drops />,
                      errorElement: <DropsPageError />,
                    },
                    {
                      path: '/event/:eventId',
                      loader: ({ params }) => replace(`/drop/${params.eventId}`),
                    },
                    {
                      path: '/events/:eventIds',
                      loader: ({ params }) => replace(`/drops/${params.eventIds}`),
                    },
                    {
                      path: '/addresses',
                      element: <Addresses />,
                    },
                    {
                      path: '/last',
                      element: <Last />,
                    },
                  ],
                },
              ])}
              fallbackElement={<CenterPage><Loading size="big" /></CenterPage>}
            />
          </EnsProvider>
        </SettingsProvider>
      </HTMLProvider>
    </main>
  )
}
