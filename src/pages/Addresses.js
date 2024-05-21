import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { parseAddress, parseAddresses } from 'models/address'
import { parseEventIds } from 'models/event'
import { AbortedError } from 'models/error'
import { HTMLContext } from 'stores/html'
import { ResolverEnsContext, ReverseEnsContext } from 'stores/ethereum'
import { fetchPOAPs, scanAddress } from 'loaders/poap'
import { getEventsOwners } from 'loaders/api'
import AddressesForm from 'components/AddressesForm'
import Card from 'components/Card'
import CenterPage from 'components/CenterPage'
import Page from 'components/Page'
import ErrorMessage from 'components/ErrorMessage'
import ButtonLink from 'components/ButtonLink'
import AddressCollector from 'components/AddressCollector'
import Status from 'components/Status'
import ShadowText from 'components/ShadowText'
import Loading from 'components/Loading'
import ButtonGroup from 'components/ButtonGroup'
import Button from 'components/Button'
import InCommon from 'components/InCommon'
import AddressAddForm from 'components/AddressAddForm'
import ButtonDelete from 'components/ButtonDelete'
import ButtonEdit from 'components/ButtonEdit'
import TokenImage from 'components/TokenImage'
import 'styles/addresses.css'

const STATE_INIT_PARSING        = 0
const STATE_ENS_RESOLVING       = 1
const STATE_INCOMMON_PROCESSING = 2
const STATE_END_RESULTS         = 3

function Addresses() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setTitle } = useContext(HTMLContext)
  const { resolveAddress, addresses: addressByEnsName } = useContext(ResolverEnsContext)
  const { resolveEnsNames, setEnsName, ensNames, isNotFound } = useContext(ReverseEnsContext)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [editMode, setEditMode] = useState(false)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [state, setState] = useState(STATE_INIT_PARSING)
  /**
   * @type {ReturnType<typeof useState<ReturnType<parseAddresses> | null>>}
   */
  const [addresses, setAddresses] = useState(null)
  /**
   * @type {ReturnType<typeof useState<Record<number, string>>>}
   */
  const [collectors, setCollectors] = useState({})
  /**
   * @type {ReturnType<typeof useState<Error[]>>}
   */
  const [errors, setErrors] = useState([])
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [loadingEventsOwners, setLoadingEventsOwners] = useState(false)
  /**
   * @type {ReturnType<typeof useState<Record<string, boolean>>>}
   */
  const [loadingByAddress, setLoadingByAddress] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, boolean>>>}
   */
  const [loadingByIndex, setLoadingByIndex] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<string, boolean>>>}
   */
  const [repeatedByAddress, setRepeatedByAddress] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<string, Error>>>}
   */
  const [errorsByAddress, setErrorsByAddress] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, Error>>>}
   */
  const [errorsByIndex, setErrorsByIndex] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<string, number>>>}
   */
  const [powers, setPowers] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, string[]>>>}
   */
  const [inCommon, setInCommon] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<number, { id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }>>>}
   */
  const [events, setEvents] = useState({})
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [loadedCount, setLoadedCount] = useState(0)

  /**
   * @param {string} address
   * @param {AbortController} controller
   */
  const loadCollector = async (address, controller) => {
    setLoadingByAddress((prevLoading) => ({ ...prevLoading, [address]: true }))
    try {
      const tokens = await scanAddress(address, controller.signal)
      setLoadedCount((prevLoadedCount) => prevLoadedCount + 1)
      setPowers((oldPowers) => ({ ...oldPowers, [address]: tokens.length }))
      for (const token of tokens) {
        const eventId = token.event.id
        setInCommon((prevInCommon) => {
          if (eventId in prevInCommon) {
            if (prevInCommon[eventId].indexOf(address) === -1) {
              prevInCommon[eventId].push(address)
            }
          } else {
            prevInCommon[eventId] = [address]
          }
          return prevInCommon
        })
        setEvents((prevEvents) => ({ ...prevEvents, [eventId]: token.event }))
      }
      setLoadingByAddress((oldLoading) => {
        /**
         * @type {Record<string, boolean>}
         */
        const newLoading = {}
        for (const [loadingAddress, loading] of Object.entries(oldLoading)) {
          if (address !== loadingAddress) {
            newLoading[loadingAddress] = loading
          }
        }
        return newLoading
      })
    } catch (err) {
      setLoadingByAddress((oldLoading) => {
        /**
         * @type {Record<string, boolean>}
         */
        const newLoading = {}
        for (const [loadingAddress, loading] of Object.entries(oldLoading)) {
          if (address !== loadingAddress) {
            newLoading[loadingAddress] = loading
          }
        }
        return newLoading
      })
      if (!(err instanceof AbortedError) && !err.aborted) {
        setErrorsByAddress((oldErrors) => ({ ...oldErrors, [address]: err }))
      }
      throw err
    }
  }

  const processCollectors = useCallback(
    /**
     * @param {string[]} resolved
     * @returns {Record<string, AbortController>}
     */
    (resolved) => {
      setLoadedCount(0)
      setInCommon({})
      setEvents({})
      setPowers({})
      setErrorsByAddress({})
      let promise = new Promise((r) => r())
      /**
       * @type {Record<string, AbortController>}
       */
      const controllers = {}
      for (const address of resolved) {
        if (!address) {
          continue
        }
        if (address in controllers) {
          setRepeatedByAddress((oldErrors) => ({ ...oldErrors, [address]: true }))
        } else {
          controllers[address] = new AbortController()
          promise = promise.then(
            () => loadCollector(address, controllers[address]),
            () => loadCollector(address, controllers[address])
          )
        }
      }
      promise.catch((err) => {
        if (!(err instanceof AbortedError) && !err.aborted) {
          console.error(err)
        }
      })
      return controllers
    },
    []
  )

  const processEnsName = useCallback(
    /**
     * @param {string} ensName
     * @param {number} index
     * @returns {Promise<string>}
     */
    (ensName, index) => {
      setLoadingByIndex((prevLoading) => ({ ...prevLoading, [index]: true }))
      return resolveAddress(ensName).then(
        (ensNameAddress)  => {
          if (ensNameAddress) {
            setLoadingByIndex((oldLoading) => {
              /**
               * @type {Record<number, boolean>}
               */
              const newLoading = {}
              for (const [loadingIndex, loading] of Object.entries(oldLoading)) {
                if (String(index) !== String(loadingIndex)) {
                  newLoading[loadingIndex] = loading
                }
              }
              return newLoading
            })
            setCollectors((oldCollectors) => ({ ...oldCollectors, [index]: ensNameAddress }))
            setEnsName(ensNameAddress, ensName)
            return Promise.resolve(ensNameAddress)
          } else {
            setLoadingByIndex((oldLoading) => {
              /**
               * @type {Record<number, boolean>}
               */
              const newLoading = {}
              for (const [loadingIndex, loading] of Object.entries(oldLoading)) {
                if (String(index) !== String(loadingIndex)) {
                  newLoading[loadingIndex] = loading
                }
              }
              return newLoading
            })
            const err = new Error(`Could not resolve ${ensName}`)
            setErrorsByIndex((oldErrors) => ({ ...oldErrors, [index]: err }))
            return Promise.reject(err)
          }
        },
        (err) => {
          setLoadingByIndex((oldLoading) => {
            /**
             * @type {Record<number, boolean>}
             */
            const newLoading = {}
            for (const [loadingIndex, loading] of Object.entries(oldLoading)) {
              if (String(index) !== String(loadingIndex)) {
                newLoading[loadingIndex] = loading
              }
            }
            return newLoading
          })
          if (!(err instanceof AbortedError) && !err.aborted) {
            setErrorsByIndex((oldErrors) => ({ ...oldErrors, [index]: err }))
          }
          return Promise.reject(err)
        }
      )
    },
    [resolveAddress, setEnsName]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      if (state === STATE_INIT_PARSING) {
        const missingEnsNames = addresses
          .filter(
            (input) => input.address !== null && input.ens === null &&
              !(input.address in ensNames) && !isNotFound(input.address)
          )
          .map((input) => input.address)
        if (missingEnsNames.length > 0) {
          resolveEnsNames(missingEnsNames).catch((err) => {
            setErrors((oldErrors) => ([...oldErrors, err]))
          })
        }
      }
    },
    [state, addresses, ensNames, isNotFound, resolveEnsNames]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      if (state === STATE_INIT_PARSING) {
        const missingAddresses = addresses
          .map((input, index) => ({ ...input, index }))
          .filter(
            (input, index) => input.address === null && input.ens !== null &&
              !(index in collectors) &&
              !(index in loadingByIndex) &&
              !(index in errorsByIndex)
          )
        if (missingAddresses.length > 0) {
          setState(STATE_ENS_RESOLVING)
          let promise = new Promise((r) => r())
          for (const { ens, index } of missingAddresses) {
            if (ens in addressByEnsName) {
              setCollectors((oldCollectors) => ({ ...oldCollectors, [index]: addressByEnsName[ens] }))
            } else {
              promise = promise.then(
                () => processEnsName(ens, index),
                () => processEnsName(ens, index)
              )
            }
          }
          promise.catch((err) => {
            if (!(err instanceof AbortedError) && !err.aborted) {
              console.error(err)
            }
          })
        }
      }
    },
    [state, addresses, collectors, addressByEnsName, loadingByIndex, errorsByIndex, processEnsName]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      let controllers = []
      const resolved = Object.values(collectors)
      if (resolved.length === addresses.length) {
        setState(STATE_INCOMMON_PROCESSING)
        controllers = Object.values(
          processCollectors(resolved)
        )
      }
      return () => {
        for (const controller of controllers) {
          controller.abort()
        }
      }
    },
    [addresses, collectors, processCollectors]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      if (loadedCount === addresses.length) {
        setState(STATE_END_RESULTS)
      }
    },
    [loadedCount, addresses]
  )

  const searchEvents = useMemo(
    () => parseEventIds(
      searchParams.get('events')
    ),
    [searchParams]
  )

  useEffect(
    () => {
      const controller= new AbortController()
      const requests = []
      const onHashChange = (ev, initial = false) => {
        setState(STATE_INIT_PARSING)
        setErrors([])
        setErrorsByAddress({})
        setErrorsByIndex({})
        setInCommon({})
        setEvents({})
        setPowers({})
        let hash = window.location.hash
        if (hash.startsWith('#')) {
          hash = hash.substring(1)
        }
        if (hash.length > 0) {
          const addresses = parseAddresses(hash, ',')
          setAddresses(addresses)
          setCollectors(
            addresses.reduce(
              (collectors, input, index) => {
                if (input.address !== null) {
                  return { ...collectors, [index]: input.address }
                }
                return collectors
              },
              {}
            )
          )
        } else if (searchEvents.length > 0) {
          setLoadingEventsOwners(true)
          if (searchParams.get('force') === 'true') {
            let promise = new Promise((resolve) => resolve())
            for (const searchEventId of searchEvents) {
              const controller = new AbortController()
              promise = promise.then(() => {
                fetchPOAPs(searchEventId, controller.signal).then(
                  (tokens) => {
                    setLoadingEventsOwners(false)
                    const owners = tokens.map((token) => token.owner)
                    const uniqueOwners = owners.filter((value, index, all) => all.indexOf(value) === index)
                    const addresses = [...uniqueOwners].map((owner) => parseAddress(owner))
                    setAddresses(addresses)
                    setCollectors(
                      addresses.reduce(
                        (collectors, input, index) => {
                          if (input.address !== null) {
                            return { ...collectors, [index]: input.address }
                          }
                          return collectors
                        },
                        {}
                      )
                    )
                  },
                  (err) => {
                    setLoadingEventsOwners(false)
                    setErrors((oldErrors) => ([...oldErrors, err]))
                  }
                )
              })
              requests.push(controller)
            }
          } else {
            getEventsOwners(searchEvents, controller.signal).then(
              (ownersMap) => {
                setLoadingEventsOwners(false)
                if (ownersMap) {
                  const uniqueOwners = Object.values(ownersMap).reduce(
                    (allOwners, eventOwners) => new Set([
                      ...allOwners,
                      ...(eventOwners?.owners ?? []),
                    ]),
                    new Set()
                  )
                  const addresses = [...uniqueOwners].map((owner) => parseAddress(owner))
                  setAddresses(addresses)
                  setCollectors(
                    addresses.reduce(
                      (collectors, input, index) => {
                        if (input.address !== null) {
                          return { ...collectors, [index]: input.address }
                        }
                        return collectors
                      },
                      {}
                    )
                  )
                } else {
                  setErrors((oldErrors) => ([...oldErrors, new Error(`Events owners could not be loaded`)]))
                }
              },
              (err) => {
                setLoadingEventsOwners(false)
                setErrors((oldErrors) => ([...oldErrors, err]))
              }
            )
          }
        } else if (!initial) {
          setAddresses(null)
          setCollectors({})
        }
      }
      onHashChange({}, true)
      window.addEventListener('hashchange', onHashChange, false)
      return () => {
        controller.abort()
        for (const request of requests) {
          request.abort()
        }
        window.removeEventListener('hashchange', onHashChange, false)
      }
    },
    [searchEvents, searchParams]
  )

  useEffect(
    () => {
      if (addresses === null) {
        setTitle('Manually Enter Collections')
      } else {
        setTitle(addresses.map((input) => input.raw).join(', '))
      }
    },
    [addresses, setTitle]
  )

  if (loadingEventsOwners) {
    return (
      <CenterPage>
        <Card>
          <Loading />
        </Card>
      </CenterPage>
    )
  }

  /**
   * @param {string[]} addresses
   */
  const openAddresses = (addresses) => {
    setEditMode(false)
    if (!addresses || addresses.length === 0) {
      window.location.hash = ''
    } else {
      window.location.hash = addresses
        .map((address) => encodeURIComponent(address))
        .join(',')
    }
  }

  const closeEditMode = () => {
    setEditMode(false)
  }

  if (addresses === null || editMode) {
    return (
      <CenterPage>
        <div className="addresses">
          {errors.length > 0 && (
            <Card>
              <div className="addresses-errors">
                {errors.map((error) => (
                  <ErrorMessage key={error.message} error={error} />
                ))}
              </div>
            </Card>
          )}
          <AddressesForm
            addresses={addresses === null ? [] : addresses.map((input) => input.raw)}
            onSubmit={openAddresses}
            onClose={editMode ? closeEditMode : undefined}
          />
          {!editMode && (
            <div className="footer">
              <ButtonLink onClick={() => navigate('/')}>back</ButtonLink>
            </div>
          )}
        </div>
      </CenterPage>
    )
  }

  /**
   * @param {string} address
   */
  const retryLoadCollector = (address) => {
    setErrorsByAddress((prevErrors) => {
      /**
       * @type {Record<string, Error>}
       */
      const newErrors = {}
      for (const [errorAddress, error] of Object.entries(prevErrors)) {
        if (errorAddress !== address) {
          newErrors[errorAddress] = error
        }
      }
      return newErrors
    })
    loadCollector(address, new AbortController())
  }

  /**
   * @param {number} index
   */
  const retryResolveAddress = (index) => {
    setErrorsByIndex((prevErrors) => {
      /**
       * @type {Record<number, Error>}
       */
      const newErrors = {}
      for (const [errorIndex, error] of Object.entries(prevErrors)) {
        if (String(errorIndex) !== String(index)) {
          newErrors[errorIndex] = error
        }
      }
      return newErrors
    })
    const entry = addresses[index]
    if (entry && entry.ens) {
      processEnsName(entry.ens, index).catch((err) => {
        if (!(err instanceof AbortedError) && !err.aborted) {
          console.error(err)
        }
      })
    }
  }

  /**
   * @param {number} index
   */
  const delAddress = (index) => {
    const entry = addresses[index]
    if (entry) {
      setEditMode(false)
      window.location.hash = addresses
        .filter((_, inputIndex) => index !== inputIndex)
        .map((input) => input.raw)
        .filter((x) => x)
        .map((address) => encodeURIComponent(address))
        .join(',')
    }
  }

  /**
   * @param {string[]} addresses
   */
  const addAddresses = (addresses) => {
    if (addresses.length > 0) {
      setEditMode(false)
      window.location.hash = `${window.location.hash},${addresses.join(',')}`
    }
  }

  /**
   * @param {number[]} eventIds
   */
  const openEvents = (eventIds) => {
    if (eventIds.length === 0) {
      return
    }
    const newEventIds = parseEventIds(eventIds.join(','))
    if (newEventIds.length > 1) {
      navigate(`/events/${newEventIds.join(',')}`)
    } else if (newEventIds.length === 1) {
      navigate(`/event/${newEventIds[0]}`)
    }
  }

  const edit = () => {
    setEditMode(true)
  }

  const totalPower = Object.values(powers).reduce(
    (total, power) => total + power,
    0
  )

  return (
    <Page>
      <div className="addresses">
        {errors.length > 0 && (
          <Card>
            <div className="addresses-errors">
              {errors.map((error) => (
                <ErrorMessage key={error.message} error={error} />
              ))}
            </div>
          </Card>
        )}
        <Card>
          <table>
            <thead>
              <tr>
                <th className="collector-head">{addresses.length} collector{addresses.length === 1 ? '' : 's'}</th>
                <th></th>
                <th>Power</th>
                {searchEvents.map((eventId) => (
                  <th key={eventId}></th>
                ))}
                <th className="collector-head-actions">
                  <ButtonGroup>
                    <ButtonEdit key="edit" secondary={true} borderless={true} onEdit={() => edit()} />
                  </ButtonGroup>
                </th>
              </tr>
            </thead>
            <tbody>
              {addresses.map(({ address, ens, raw }, index) => (
                <tr key={`${index}-${raw}`}>
                  <td>
                    <AddressCollector address={address ?? collectors[index]} ens={ens} bigEns={true} />
                  </td>
                  <td>
                    <div className="collector-status">
                      <Status
                        loading={state === STATE_ENS_RESOLVING && index in loadingByIndex && !(address in errorsByAddress) && !(index in errorsByIndex)}
                        error={(address ?? collectors[index]) in errorsByAddress || index in errorsByIndex}
                      />
                      {(address ?? collectors[index]) in errorsByAddress && (
                        <>
                          <span className="status-error-message">{errorsByAddress[address ?? collectors[index]].message}</span>{' '}
                          {!repeatedByAddress[address ?? collectors[index]] && (
                            <ButtonLink onClick={() => retryLoadCollector(address ?? collectors[index])}>retry</ButtonLink>
                          )}
                        </>
                      )}
                      {index in errorsByIndex && (
                        <>
                          <span className="status-error-message">{errorsByIndex[index].message}</span>{' '}
                          <ButtonLink onClick={() => retryResolveAddress(index)}>retry</ButtonLink>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="collector-cell-power">
                    {state === STATE_INCOMMON_PROCESSING &&
                      (address ?? collectors[index]) in loadingByAddress &&
                      !((address ?? collectors[index]) in errorsByAddress) &&
                      (
                        <Loading small={true} />
                      )
                    }
                    {(address ?? collectors[index]) in powers &&
                      !((address ?? collectors[index]) in loadingByAddress) &&
                      !((address ?? collectors[index]) in errorsByAddress) &&
                      (
                        <ShadowText grow={true} medium={true}>{formatStat(powers[(address ?? collectors[index])])}</ShadowText>
                      )
                    }
                  </td>
                  {searchEvents.map((eventId) => (
                    <td key={eventId}>
                      {eventId in inCommon && inCommon[eventId].includes(address) && eventId in events && (
                        <TokenImage event={events[eventId]} size={48} />
                      )}
                    </td>
                  ))}
                  <td className="collector-cell-actions">
                    <ButtonGroup>
                      <ButtonDelete
                        key="del"
                        onDelete={() => delAddress(index)}
                        title={`Removes ${addresses[index].raw}`}
                      />
                    </ButtonGroup>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>
                  <AddressAddForm onSubmit={addAddresses} />
                </td>
                <td></td>
                <td className="collector-cell-power">
                  {state === STATE_END_RESULTS && totalPower > 0 && (
                    <ShadowText grow={true} medium={true}>
                      {formatStat(totalPower)}
                    </ShadowText>
                  )}
                </td>
                <td className="collector-cell-actions"></td>
              </tr>
            </tfoot>
          </table>
        </Card>
        {state === STATE_END_RESULTS && (
          <InCommon
            inCommon={inCommon}
            events={events}
            showCount={addresses.length}
            createButtons={(eventIds) => ([
              <Button
                key="open-all"
                disabled={eventIds.length === 0}
                onClick={() => openEvents(eventIds)}
              >
                Open selected
              </Button>,
            ])}
          />
        )}
      </div>
    </Page>
  )
}

export default Addresses
