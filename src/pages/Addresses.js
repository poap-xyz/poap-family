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
import { uniq } from 'utils/array'
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
  const {
    resolveAddress,
    getAddress,
    isEnsAddressNotFound,
  } = useContext(ResolverEnsContext)
  const {
    resolveEnsNames,
    setEnsName,
    getEnsName,
  } = useContext(ReverseEnsContext)
  /**
   * @type {ReturnType<typeof useState<boolean>>}
   */
  const [editMode, setEditMode] = useState(false)
  /**
   * @type {ReturnType<typeof useState<number>>}
   */
  const [state, setState] = useState(STATE_INIT_PARSING)
  /**
   * @type {ReturnType<typeof useState<ReturnType<typeof parseAddresses> | null>>}
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
   */
  const enableLoadingByAddress = (address) => {
    setLoadingByAddress((prevLoading) => ({
      ...(prevLoading ?? {}),
      [address]: true,
    }))
  }

  /**
   * @param {string} address
   */
  const disableLoadingByAddress = (address) => {
    setLoadingByAddress((prevLoading) => {
      if (prevLoading == null) {
        return {}
      }
      /**
       * @type {Record<string, boolean>}
       */
      const nextLoading = {}
      for (const [loadingAddress, loading] of Object.entries(prevLoading)) {
        if (address !== loadingAddress) {
          nextLoading[loadingAddress] = loading
        }
      }
      return nextLoading
    })
  }

  /**
   * @param {string} address
   * @param {Error} error
   */
  const setErrorByAddress = (address, error) => {
    setErrorsByAddress((prevErrors) => ({
      ...(prevErrors ?? {}),
      [address]: error,
    }))
  }

  const incrLoadedCount = () => {
    setLoadedCount((prevLoadedCount) => (prevLoadedCount ?? 0) + 1)
  }

  /**
   * @param {string} address
   * @param {number} power
   */
  const setPower = (address, power) => {
    setPowers((oldPowers) => ({
      ...oldPowers,
      [address]: power,
    }))
  }

  /**
   * @param {string} address
   * @param {{ id: number; name: string; description?: string; image_url: string; original_url: string; city: string | null; country: string | null; start_date: string; end_date: string; expiry_date: string }} event
   */
  const updateAddressEvent = (address, event) => {
    const eventId = event.id
    setInCommon((alsoInCommon) => {
      if (!alsoInCommon) {
        return { [eventId]: [address] }
      }
      if (eventId in alsoInCommon) {
        if (!alsoInCommon[eventId].includes(address)) {
          alsoInCommon[eventId].push(address)
        }
      } else {
        alsoInCommon[eventId] = [address]
      }
      return alsoInCommon
    })
    setEvents((prevEvents) => ({
      ...prevEvents,
      [eventId]: event,
    }))
  }

  /**
   * @param {number} index
   */
  const enableLoadingByIndex = (index) => {
    setLoadingByIndex((prevLoading) => ({
      ...(prevLoading ?? {}),
      [index]: true,
    }))
  }

  /**
   * @param {number} index
   */
  const disableLoadingByIndex = (index) => {
    setLoadingByIndex((oldLoading) => {
      if (oldLoading == null) {
        return {}
      }
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
  }

  /**
   * @param {number} index
   * @param {Error} error
   */
  const setErrorByIndex = (index, error) => {
    setErrorsByIndex((oldErrors) => ({
      ...(oldErrors ?? {}),
      [index]: error,
    }))
  }

  /**
   * @param {Error} error
   */
  const addError = (error) => {
    setErrors((oldErrors) => ([...(oldErrors ?? []), error]))
  }

  /**
   * @param {ReturnType<typeof parseAddresses>} addresses
   */
  const updateAddresses = (addresses) => {
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
  }

  /**
   * @param {number} index
   * @param {string} address
   */
  const setCollector = (index, address) => {
    setCollectors((oldCollectors) => ({
      ...oldCollectors,
      [index]: address,
    }))
  }

  const loadCollector = useCallback(
    /**
     * @param {string} address
     * @param {AbortController} controller
     */
    async (address, controller) => {
      enableLoadingByAddress(address)
      try {
        const tokens = await scanAddress(address, controller.signal)
        incrLoadedCount()
        setPower(address, tokens.length)
        for (const token of tokens) {
          const event = token.event
          if (event == null) {
            setErrorByAddress(
              address,
              new Error(`Could not find POAP ${token.id}`)
            )
            continue
          }
          updateAddressEvent(address, event)
        }
        disableLoadingByAddress(address)
      } catch (err) {
        if (!(err instanceof AbortedError)) {
          if (err instanceof Error) {
            setErrorByAddress(address, err)
          } else {
            setErrorByAddress(
              address,
              new Error('Load collector failed', { cause: err })
            )
          }
        }
        disableLoadingByAddress(address)
        throw err
      }
    },
    []
  )

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
      let promise = new Promise((r) => r(undefined))
      /**
       * @type {Record<string, AbortController>}
       */
      const controllers = {}
      for (const address of resolved) {
        if (!address) {
          continue
        }
        if (address in controllers) {
          setRepeatedByAddress((prevErrors) => ({
            ...(prevErrors ?? {}),
            [address]: true,
          }))
        } else {
          controllers[address] = new AbortController()
          promise = promise.then(
            () => loadCollector(address, controllers[address]),
            () => loadCollector(address, controllers[address])
          )
        }
      }
      promise.catch((err) => {
        if (!(err instanceof AbortedError)) {
          console.error(err)
        }
      })
      return controllers
    },
    [loadCollector]
  )

  const processEnsName = useCallback(
    /**
     * @param {string} ensName
     * @param {number} index
     * @returns {Promise<string>}
     */
    (ensName, index) => {
      enableLoadingByIndex(index)
      return resolveAddress(ensName).then(
        (ensNameAddress)  => {
          if (ensNameAddress != null) {
            disableLoadingByIndex(index)
            setCollector(index, ensNameAddress)
            setEnsName(ensNameAddress, ensName)
            return Promise.resolve(ensNameAddress)
          } else {
            disableLoadingByIndex(index)
            const error = new Error(`Address for ${ensName} not found`)
            setErrorByIndex(index, error)
            return Promise.reject(error)
          }
        },
        (err) => {
          disableLoadingByIndex(index)
          if (!(err instanceof AbortedError)) {
            setErrorByIndex(
              index,
              new Error(`Could not resolve ${ensName}`, { cause: err })
            )
          }
          return Promise.reject(err)
        }
      )
    },
    [resolveAddress, setEnsName]
  )

  const searchEvents = useMemo(
    () => parseEventIds(
      searchParams.get('events') ?? ''
    ),
    [searchParams]
  )

  const force = useMemo(
    () => searchParams.get('force') === 'true',
    [searchParams]
  )

  const updateCollectionFromHash = useCallback(
    (initial = false) => {
      /**
       * @type {AbortController[]}
       */
      const controllers = []
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
        updateAddresses(addresses)
        for (let index = 0; index < addresses.length; index++) {
          if (
            addresses[index].address == null &&
            addresses[index].ens == null
          ) {
            setErrorByIndex(index, new Error('Address not found'))
          }
        }
      } else if (searchEvents.length > 0) {
        setLoadingEventsOwners(true)
        if (force) {
          let promise = new Promise((r) => r(undefined))
          for (const searchEventId of searchEvents) {
            const controller = new AbortController()
            promise = promise.then(() => {
              fetchPOAPs(searchEventId, controller.signal).then(
                (tokens) => {
                  setLoadingEventsOwners(false)
                  const owners = uniq(tokens.map((token) => token.owner))
                  const addresses = owners.map((owner) => parseAddress(owner))
                  updateAddresses(addresses)
                },
                (err) => {
                  setLoadingEventsOwners(false)
                  addError(
                    new Error(`Cannot load drop ${searchEventId}`, {
                      cause: err,
                    })
                  )
                }
              )
            })
            controllers.push(controller)
          }
        } else {
          const controller = new AbortController()
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
                const addresses = [...uniqueOwners].map(
                  (owner) => parseAddress(owner)
                )
                updateAddresses(addresses)
              } else {
                addError(new Error(`Drop owners could not be loaded`))
              }
            },
            (err) => {
              setLoadingEventsOwners(false)
              addError(new Error(`Drop owners could not be loaded`, {
                cause: err,
              }))
            }
          )
          controllers.push(controller)
        }
      } else if (!initial) {
        setAddresses(null)
        setCollectors({})
      }
      return controllers
    },
    [searchEvents, force]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      if (state === STATE_INIT_PARSING) {
        const missingEnsNames = addresses
          .filter(
            (input) =>
              input.address !== null &&
              input.ens === null &&
              getEnsName(input.address) == null
          )
          .map((input) => input.address)

        if (missingEnsNames.length > 0) {
          resolveEnsNames(missingEnsNames).catch((err) => {
            setErrors((oldErrors) => ([...(oldErrors ?? []), err]))
          })
        }
      }
    },
    [state, addresses, getEnsName, resolveEnsNames]
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
          let promise = new Promise((r) => r(undefined))
          for (const { ens, index } of missingAddresses) {
            if (!isEnsAddressNotFound(ens)) {
              const address = getAddress(ens)
              if (address != null) {
                setCollector(index, address)
              } else {
                setErrorByIndex(
                  index,
                  new Error(`Address for ${ens} not found`)
                )
              }
            } else {
              promise = promise.then(
                () => processEnsName(ens, index),
                () => processEnsName(ens, index)
              )
            }
          }
          promise.catch((err) => {
            if (!(err instanceof AbortedError)) {
              console.error(err)
            }
          })
        }
      }
    },
    [
      state,
      addresses,
      collectors,
      loadingByIndex,
      errorsByIndex,
      getAddress,
      isEnsAddressNotFound,
      processEnsName,
    ]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      /**
       * @type {AbortController[]}
       */
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

  useEffect(
    () => {
      let controllers = updateCollectionFromHash(true)
      const onHashChange = () => {
        controllers = updateCollectionFromHash()
      }
      window.addEventListener('hashchange', onHashChange, false)
      return () => {
        for (const controller of controllers) {
          controller.abort()
        }
        window.removeEventListener('hashchange', onHashChange, false)
      }
    },
    [updateCollectionFromHash]
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
            addresses={addresses === null
              ? []
              : addresses.map((input) => input.raw)}
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
      const nextErrors = {}
      for (const [errorAddress, error] of Object.entries(prevErrors)) {
        if (errorAddress !== address) {
          nextErrors[errorAddress] = error
        }
      }
      return nextErrors
    })
    loadCollector(address, new AbortController())
  }

  /**
   * @param {number} index
   */
  const retryResolveAddress = (index) => {
    setErrorsByIndex((prevErrors) => {
      if (prevErrors == null) {
        return {}
      }
      /**
       * @type {Record<number, Error>}
       */
      const nextErrors = {}
      for (const [errorIndex, error] of Object.entries(prevErrors)) {
        if (String(errorIndex) !== String(index)) {
          nextErrors[errorIndex] = error
        }
      }
      return nextErrors
    })
    const entry = addresses[index]
    if (entry == null) {
      return
    }
    if (entry.ens != null) {
      processEnsName(entry.ens, index).catch((err) => {
        if (!(err instanceof AbortedError)) {
          console.error(err)
        }
      })
    }
    if (entry.address == null && entry.ens == null) {
      setErrorByIndex(index, new Error('Address still not found'))
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
   * @param {string[]} moreAddresses
   */
  const addAddresses = (moreAddresses) => {
    if (moreAddresses.length > 0) {
      setEditMode(false)
      window.location.hash = `${window.location.hash},${moreAddresses.join(',')}`
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
                <th className="collector-head">
                  {addresses.length}{' '}
                  collector{addresses.length === 1 ? '' : 's'}
                </th>
                <th></th>
                <th>Power</th>
                {searchEvents.map((eventId) => (
                  <th key={eventId}></th>
                ))}
                <th className="collector-head-actions">
                  <ButtonGroup>
                    <ButtonEdit
                      key="edit"
                      onEdit={() => edit()}
                      title="Manually enter the list of addresses"
                    />
                  </ButtonGroup>
                </th>
              </tr>
            </thead>
            <tbody>
              {addresses.map(({ address, ens, raw }, index) => (
                <tr key={`${index}-${raw}`}>
                  <td>
                    {(address || collectors[index])
                      ? (
                        <AddressCollector
                          address={address ?? collectors[index]}
                          ens={ens}
                          bigEns={true}
                        />
                      ) : (
                        <span>{raw}</span>
                      )}
                  </td>
                  <td>
                    <div className="collector-status">
                      <Status
                        loading={state === STATE_ENS_RESOLVING && index in loadingByIndex && !(address in errorsByAddress) && !(index in errorsByIndex)}
                        error={(address ?? collectors[index]) in errorsByAddress || index in errorsByIndex}
                      />
                      {(address ?? collectors[index]) in errorsByAddress && (
                        <>
                          <span className="status-error-message">
                            {errorsByAddress[address ?? collectors[index]].message}
                          </span>
                          {' '}
                          {!repeatedByAddress[address ?? collectors[index]] && (
                            <ButtonLink
                              onClick={() => {
                                retryLoadCollector(address ?? collectors[index])
                              }}
                            >
                              retry
                            </ButtonLink>
                          )}
                        </>
                      )}
                      {index in errorsByIndex && (
                        <>
                          <span className="status-error-message">
                            {errorsByIndex[index].message}
                          </span>
                          {' '}
                          <ButtonLink
                            onClick={() => retryResolveAddress(index)}
                          >
                            retry
                          </ButtonLink>
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
                        <ShadowText
                          grow={true}
                          medium={true}
                        >
                          {formatStat(powers[(address ?? collectors[index])])}
                        </ShadowText>
                      )
                    }
                  </td>
                  {searchEvents.map((eventId) => (
                    <td key={eventId}>
                      {
                        eventId in inCommon &&
                        inCommon[eventId].includes(address) &&
                        eventId in events && (
                          <TokenImage event={events[eventId]} size={48} />
                        )
                      }
                    </td>
                  ))}
                  <td className="collector-cell-actions">
                    <ButtonGroup>
                      <ButtonDelete
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
