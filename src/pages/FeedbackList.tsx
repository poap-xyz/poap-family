import { useContext, useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { HTMLContext } from 'stores/html'
import { AdminContext } from 'stores/admin'
import { delFeedback, getFeedback } from 'loaders/api'
import { Feedback } from 'models/api'
import Timestamp from 'components/Timestamp'
import Card from 'components/Card'
import ErrorMessage from 'components/ErrorMessage'
import Loading from 'components/Loading'
import Pagination from 'components/Pagination'
import Page from 'components/Page'
import ButtonDelete from 'components/ButtonDelete'
import 'styles/feedback-list.css'

function FeedbackList({ qty = 10 }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { passphrase, authenticated } = useContext(AdminContext)
  const [page, setPage] = useState<number>(1)
  const [pages, setPages] = useState<number>(0)
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [error, setError] = useState<Error | null>(null)

  useEffect(
    () => {
      const searchPage = searchParams.get('page')
      if (searchPage) {
        const currentPage = parseInt(searchPage)
        if (!isNaN(currentPage)) {
          setPage(currentPage)
        }
      }
    },
    [searchParams]
  )

  useEffect(
    () => {
      if (!authenticated || passphrase == null) {
        return
      }
      setLoading(true)
      getFeedback(passphrase, page, qty).then(
        (response) => {
          if (response !== null) {
            setPages(response.pages)
            setTotal(response.total)
            setFeedback(response.feedback)

            if (response.total === 0 || response.pages === 0) {
              setError(new Error('Empty'))
            }
          }
          setLoading(false)
        },
        (err) => {
          setError(err)
          setLoading(false)
        }
      )
    },
    [page, qty, authenticated, passphrase]
  )

  useEffect(
    () => {
      setTitle('Feedback')
    },
    [setTitle]
  )

  function onPageChange(newPage: number): void {
    setSearchParams({ page: String(newPage) })
  }

  function handleDelFeedback(id: number): void {
    if (!authenticated || passphrase == null) {
      return
    }
    setFeedback((oldFeedback) => {
      if (oldFeedback == null) {
        return []
      }
      const newFeedback = []
      for (let i = 0; i < oldFeedback.length; i++) {
        if (oldFeedback[i].id !== id) {
          newFeedback.push(oldFeedback[i])
        }
      }
      return newFeedback
    })
    delFeedback(id, passphrase).then(
      () => { },
      (err) => {
        setError(err)
      }
    )
  }

  return (
    <Page>
      <div className="feedback-list">
        <Card>
          <h3>Feedback</h3>
          {loading && <Loading />}
          {feedback.length > 0 && !loading && (
            <ul className="feedback-items">
              {feedback.map((item) =>
                <li key={item.id}>
                  <div className="feedback-item">
                    <pre>{item.message}</pre>
                    <div className="feedback-ts">
                      {item.location
                        ? (
                          <Link to={item.location}>
                            <Timestamp ts={item.ts} />
                          </Link>
                        )
                        : <Timestamp ts={item.ts} />
                      }
                    </div>
                    <div className="feedback-actions">
                      <ButtonDelete
                        key="del"
                        onDelete={() => handleDelFeedback(item.id)}
                        title={`Removes feedback #${item.id}`}
                      />
                    </div>
                  </div>
                </li>
              )}
            </ul>
          )}
          {error && (
            <ErrorMessage away={true} error={error} />
          )}
          {pages > 1 && (
            <Pagination
              page={page}
              pages={pages}
              total={total}
              onPage={onPageChange}
            />
          )}
        </Card>
      </div>
    </Page>
  )
}

export default FeedbackList
