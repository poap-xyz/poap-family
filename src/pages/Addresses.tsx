import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { formatStat } from 'utils/number'
import { parseAddress, parseAddresses, ParsedAddress } from 'models/address'
import { parseDropIds, Drop } from 'models/drop'
import { AbortedError } from 'models/error'
import { InCommon } from 'models/in-common'
import { EnsByAddress } from 'models/ethereum'
import { HTMLContext } from 'stores/html'
import { ResolverEnsContext, ReverseEnsContext } from 'stores/ethereum'
import { fetchCollectorDrops, fetchDropsCollectors } from 'services/collectors'
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
import DropsInCommon from 'components/DropsInCommon'
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
    isEnsAddressFound,
    isEnsAddressNotFound,
  } = useContext(ResolverEnsContext)
  const {
    resolveEnsNames,
    setEnsName,
    getEnsName,
  } = useContext(ReverseEnsContext)

  const [editMode, setEditMode] = useState<boolean>(false)
  const [state, setState] = useState<number>(STATE_INIT_PARSING)
  const [addresses, setAddresses] = useState<ParsedAddress[] | null>(null)
  const [collectors, setCollectors] = useState<Record<number, string>>({})
  const [errors, setErrors] = useState<Error[]>([])
  const [loadingDropsCollectors, setLoadingDropsCollectors] = useState<boolean>(false)
  const [loadingByAddress, setLoadingByAddress] = useState<Record<string, boolean>>({})
  const [loadingByIndex, setLoadingByIndex] = useState<Record<number, boolean>>({})
  const [repeatedByAddress, setRepeatedByAddress] = useState<Record<string, boolean>>({})
  const [errorsByAddress, setErrorsByAddress] = useState<Record<string, Error>>({})
  const [errorsByIndex, setErrorsByIndex] = useState<Record<number, Error>>({})
  const [powers, setPowers] = useState<Record<string, number>>({})
  const [inCommon, setInCommon] = useState<InCommon>({})
  const [drops, setDrops] = useState<Record<number, Drop>>({})
  const [loadedCount, setLoadedCount] = useState<number>(0)
  const [dropsEnsNames, setDropsEnsNames] = useState<Record<number, EnsByAddress>>({})

  function enableLoadingByAddress(address: string): void {
    setLoadingByAddress((prevLoading) => ({
      ...(prevLoading ?? {}),
      [address]: true,
    }))
  }

  function disableLoadingByAddress(address: string): void {
    setLoadingByAddress((prevLoading) => {
      if (prevLoading == null) {
        return {}
      }
      const nextLoading: Record<string, boolean> = {}
      for (const [loadingAddress, loading] of Object.entries(prevLoading)) {
        if (address !== loadingAddress) {
          nextLoading[loadingAddress] = loading
        }
      }
      return nextLoading
    })
  }

  function setErrorByAddress(address: string, error: Error): void {
    setErrorsByAddress((prevErrors) => ({
      ...(prevErrors ?? {}),
      [address]: error,
    }))
  }

  function incrLoadedCount(): void {
    setLoadedCount((prevLoadedCount) => (prevLoadedCount ?? 0) + 1)
  }

  function setPower(address: string, power: number) {
    setPowers((oldPowers) => ({
      ...oldPowers,
      [address]: power,
    }))
  }

  function updateAddressDrop(address: string, drop: Drop): void {
    const dropId = drop.id
    setInCommon((alsoInCommon) => {
      if (!alsoInCommon) {
        return { [dropId]: [address] }
      }
      if (dropId in alsoInCommon) {
        if (!alsoInCommon[dropId].includes(address)) {
          alsoInCommon[dropId].push(address)
        }
      } else {
        alsoInCommon[dropId] = [address]
      }
      return alsoInCommon
    })
    setDrops((prevDrops) => ({
      ...prevDrops,
      [dropId]: drop,
    }))
  }

  function enableLoadingByIndex(index: number): void {
    setLoadingByIndex((prevLoading) => ({
      ...(prevLoading ?? {}),
      [index]: true,
    }))
  }

  function disableLoadingByIndex(index: number): void {
    setLoadingByIndex((oldLoading) => {
      if (oldLoading == null) {
        return {}
      }
      const newLoading: Record<number, boolean> = {}
      for (const [loadingIndex, loading] of Object.entries(oldLoading)) {
        if (String(index) !== String(loadingIndex)) {
          newLoading[loadingIndex] = loading
        }
      }
      return newLoading
    })
  }

  function setErrorByIndex(index: number, error: Error): void {
    setErrorsByIndex((oldErrors) => ({
      ...(oldErrors ?? {}),
      [index]: error,
    }))
  }

  function addError(error: Error): void {
    setErrors((oldErrors) => ([...(oldErrors ?? []), error]))
  }

  function updateAddresses(addresses: ParsedAddress[]): void {
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

  function setCollector(index: number, address: string): void {
    setCollectors((oldCollectors) => ({
      ...oldCollectors,
      [index]: address,
    }))
  }

  const loadCollector = useCallback(
    async (address: string, controller: AbortController) => {
      enableLoadingByAddress(address)
      try {
        const addressDrops = await fetchCollectorDrops(address, controller.signal)
        incrLoadedCount()
        setPower(address, addressDrops.length)
        for (const addressDrop of addressDrops) {
          updateAddressDrop(address, addressDrop)
        }
        disableLoadingByAddress(address)
      } catch (err: unknown) {
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
    (resolved: string[]): Record<string, AbortController> => {
      setLoadedCount(0)
      setInCommon({})
      setDrops({})
      setPowers({})
      setErrorsByAddress({})
      let promise = new Promise((r) => r(undefined))
      const controllers: Record<string, AbortController> = {}
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
      promise.catch((err: unknown) => {
        if (!(err instanceof AbortedError)) {
          console.error(err)
        }
      })
      return controllers
    },
    [loadCollector]
  )

  const processEnsName = useCallback(
    (ensName: string, index: number): Promise<string> => {
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

  const searchDropIds = useMemo(
    () => parseDropIds(
      searchParams.get('events') ?? ''
    ),
    [searchParams]
  )

  const updateCollectionFromHash = useCallback(
    (initial = false) => {
      const controllers: AbortController[] = []
      setState(STATE_INIT_PARSING)
      setErrors([])
      setErrorsByAddress({})
      setErrorsByIndex({})
      setInCommon({})
      setDrops({})
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
      } else if (searchDropIds.length > 0) {
        setLoadingDropsCollectors(true)
        const controller = new AbortController()
        fetchDropsCollectors(searchDropIds, controller.signal).then(
          (collectors) => {
            let addresses: ParsedAddress[] | undefined
            try {
              addresses = collectors.map((collector) => parseAddress(collector))
            } catch (err: unknown) {
              setLoadingDropsCollectors(false)
              addError(
                new Error('Cannot parse collectors', {
                  cause: err,
                })
              )
              return
            }

            setLoadingDropsCollectors(false)
            updateAddresses(addresses)
          },
          (err) => {
            setLoadingDropsCollectors(false)
            addError(
              new Error(`Cannot load drops ${searchDropIds.join(', ')}`, {
                cause: err,
              })
            )
          }
        )
        controllers.push(controller)
      } else if (!initial) {
        setAddresses(null)
        setCollectors({})
      }
      return controllers
    },
    [searchDropIds]
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
          resolveEnsNames(missingEnsNames).catch((err: unknown) => {
            setErrors((oldErrors) => ([
              ...(oldErrors ?? []),
              new Error(`Could not resolve some ENS names`, { cause: err }),
            ]))
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
            if (isEnsAddressFound(ens)) {
              const address = getAddress(ens)
              if (address != null) {
                setCollector(index, address)
              } else {
                setErrorByIndex(
                  index,
                  new Error(`Address for ${ens} doesn't exists`)
                )
              }
            } else if (isEnsAddressNotFound(ens)) {
              setErrorByIndex(
                index,
                new Error(`Address for ${ens} not found`)
              )
            } else {
              promise = promise.then(
                () => processEnsName(ens, index),
                () => processEnsName(ens, index)
              )
            }
          }
          promise.catch((err: unknown) => {
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
      isEnsAddressFound,
      isEnsAddressNotFound,
      processEnsName,
    ]
  )

  useEffect(
    () => {
      if (addresses === null) {
        return
      }
      let controllers: AbortController[] = []
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

  if (loadingDropsCollectors) {
    return (
      <CenterPage>
        <Card>
          <Loading size="big" />
        </Card>
      </CenterPage>
    )
  }

  function openAddresses(addresses: string[]): void {
    setEditMode(false)
    if (!addresses || addresses.length === 0) {
      window.location.hash = ''
    } else {
      window.location.hash = addresses
        .map((address) => encodeURIComponent(address))
        .join(',')
    }
  }

  function closeEditMode(): void {
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

  function retryLoadCollector(address: string): void {
    setErrorsByAddress((prevErrors) => {
      const nextErrors: Record<string, Error> = {}
      for (const [errorAddress, error] of Object.entries(prevErrors)) {
        if (errorAddress !== address) {
          nextErrors[errorAddress] = error
        }
      }
      return nextErrors
    })
    loadCollector(address, new AbortController())
  }

  function retryResolveAddress(index: number): void {
    setErrorsByIndex((prevErrors) => {
      if (prevErrors == null) {
        return {}
      }
      const nextErrors: Record<number, Error> = {}
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
      processEnsName(entry.ens, index).catch((err: unknown) => {
        if (!(err instanceof AbortedError)) {
          console.error(err)
        }
      })
    }
    if (entry.address == null && entry.ens == null) {
      setErrorByIndex(index, new Error('Address still not found'))
    }
  }

  function delAddress(index: number): void {
    const entry = addresses[index]
    if (entry) {
      setEditMode(false)
      window.location.hash = addresses
        .filter((_, inputIndex) => index !== inputIndex)
        .map((input) => input.raw)
        .filter((x) => x != null)
        .map((address) => encodeURIComponent(address))
        .join(',')
    }
  }

  function addAddresses(moreAddresses: string[]): void {
    if (moreAddresses.length > 0) {
      setEditMode(false)
      window.location.hash = `${window.location.hash},${moreAddresses.join(',')}`
    }
  }

  function edit(): void {
    setEditMode(true)
  }

  const totalPower = Object.values(powers).reduce(
    (total, power) => total + power,
    0
  )

  function handleDropActive(dropId: number): void {
    const addresses = inCommon[dropId]
    if (addresses != null && addresses.length > 0) {
      resolveEnsNames(addresses).then((ensNames) => {
        setDropsEnsNames((prevDropsEnsNames) => ({
          ...prevDropsEnsNames,
          [dropId]: ensNames,
        }))
      }).catch((err: unknown) => {
        setErrors((oldErrors) => ([
          ...(oldErrors ?? []),
          new Error(`Could not resolve drop ENS names`, { cause: err }),
        ]))
      })
    }
  }

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
                {searchDropIds.map((dropId) => (
                  <th key={dropId}></th>
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
                        <Loading size="small" />
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
                  {searchDropIds.map((dropId) => (
                    <td key={dropId}>
                      {
                        dropId in inCommon &&
                        inCommon[dropId].includes(address) &&
                        dropId in drops && (
                          <TokenImage drop={drops[dropId]} size={48} />
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
          <DropsInCommon
            onActive={handleDropActive}
            inCommon={inCommon}
            drops={drops}
            showCount={addresses.length}
            dropsEnsNames={dropsEnsNames}
          />
        )}
      </div>
    </Page>
  )
}

export default Addresses
