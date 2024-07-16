import PropTypes from 'prop-types'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { ENS_RESOLVE_BATCH_SIZE } from 'models/ethereum'
import {
  resolveAddress as ethereumResolveAddress,
  resolveEnsNames as ethereumResolveEnsNames,
  resolveEnsAvatar as ethereumResolveEnsAvatar
} from 'loaders/ethereum'

export const ResolverEnsContext = createContext({
  /**
   * @type {(ensName: string) => Promise<string | null>}
   */
  resolveAddress: async (ensName) => null,
  /**
   * @type {(ensName: string) => string | null}
   */
  getAddress: (ensName) => null,
  /**
   * @type {(ensName: string) => boolean}
   */
  isEnsAddressFound: (ensName) => false,
  /**
   * @type {(ensName: string) => boolean}
   */
  isEnsAddressNotFound: (ensName) => false,
  /**
   * @type {(ensName: string, address?: string) => Promise<{ avatar: string | null }>}
   */
  resolveMeta: async (ensName, address) => ({ avatar: null }),
  /**
   * @type {(ensName: string) => { avatar: string | null }}
   */
  getMeta: (ensName) => null,
})

export const ReverseEnsContext = createContext({
  /**
   * @type {(addresses: string[], resolve?: boolean) => Promise<Record<string, string>>}
   */
  resolveEnsNames: async (addresses, resolve = false) => ({}),
  /**
   * @type {(address: string, ensName: string) => void}
   */
  setEnsName: (address, ensName) => {},
  /**
   * @type {(address: string) => string | null}
   */
  getEnsName: (address) => null,
  /**
   * @type {(address: string) => boolean}
   */
  isAddressEnsNotFound: (address) => false,
})

/**
 * @param {Record<string, { address: string | null, avatar: string | null }>} dataByEnsName
 * @param {{ ensName: string, address?: string | null, avatar?: string | null }} action
 */
function resolverEnsReducer(dataByEnsName, { ensName, address, avatar }) {
  return {
    ...dataByEnsName,
    [ensName]: {
      address: address ?? dataByEnsName[ensName]?.address,
      avatar: avatar ?? dataByEnsName[ensName]?.avatar,
    },
  }
}

/**
 * @param {PropTypes.InferProps<ResolverEnsProvider.propTypes>} props
 */
function ResolverEnsProvider({ children }) {
  const [dataByEnsName, dispatch] = useReducer(resolverEnsReducer, {})
  const cacheDataByEnsName = useRef({})

  // FIXME
  cacheDataByEnsName.current = dataByEnsName

  const getAddress = useCallback(
    /**
     * @param {string} ensName
     */
    (ensName) => {
      return cacheDataByEnsName.current[ensName]?.address ?? null
    },
    []
  )

  const isEnsAddressFound = useCallback(
    /**
     * @param {string} ensName
     */
    (ensName) => {
      return cacheDataByEnsName.current[ensName]?.address != null
    },
    []
  )

  const isEnsAddressNotFound = useCallback(
    /**
     * @param {string} ensName
     */
    (ensName) => {
      return cacheDataByEnsName.current[ensName]?.address === null
    },
    []
  )

  const resolveAddress = useCallback(
    /**
     * @param {string} ensName
     * @returns {Promise<string | null>}
     */
    async (ensName) => {
      if (isEnsAddressFound(ensName)) {
        return getAddress(ensName)
      }
      const address = await ethereumResolveAddress(ensName)
      if (address) {
        dispatch({ ensName, address })
      } else {
        dispatch({ ensName, address: null })
      }
      return address
    },
    [getAddress, isEnsAddressFound]
  )

  const resolveAvatar = useCallback(
    /**
     * @param {string} ensName
     * @param {string} [address]
     * @returns {Promise<string | null>}
     */
    async (ensName, address) => {
      let avatar = await ethereumResolveEnsAvatar(ensName)
      if (!avatar && address) {
        avatar = await ethereumResolveEnsAvatar(address)
      }
      if (avatar) {
        dispatch({ ensName, address, avatar })
      } else {
        dispatch({ ensName, address, avatar: null })
      }
      return avatar
    },
    []
  )

  const getMeta = useCallback(
    /**
     * @param {string} ensName
     * @returns {{ avatar: string | null }}
     */
    (ensName) => {
      const avatar = dataByEnsName[ensName]?.avatar ?? null
      return { avatar }
    },
    [dataByEnsName]
  )

  const resolveMeta = useCallback(
    /**
     * @param {string} ensName
     * @param {string} [address]
     * @returns {Promise<{ avatar: string | null }>}
     */
    async (ensName, address) => {
      const avatar = await resolveAvatar(ensName, address)
      return { avatar }
    },
    [resolveAvatar]
  )

  const value = useMemo(
    () => ({
      getAddress,
      isEnsAddressFound,
      isEnsAddressNotFound,
      resolveAddress,
      getMeta,
      resolveMeta,
    }),
    [
      getAddress,
      isEnsAddressFound,
      isEnsAddressNotFound,
      resolveAddress,
      getMeta,
      resolveMeta,
    ]
  )

  return (
    <ResolverEnsContext.Provider value={value}>
      {children}
    </ResolverEnsContext.Provider>
  )
}

ResolverEnsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

/**
 * @param {Record<string, string | null>} ensByAddress
 * @param {{ type?: 'prepend' | 'append', newEnsByAddress: Record<string, string | null> }} action
 */
const reverseEnsReducer = (
  ensByAddress,
  {
    type = 'append',
    newEnsByAddress,
  }
) => {
  if (type === 'prepend') {
    return {
      ...newEnsByAddress,
      ...ensByAddress,
    }
  }
  return {
    ...ensByAddress,
    ...newEnsByAddress,
  }
}

/**
 * @param {PropTypes.InferProps<ReverseEnsProvider.propTypes>} props
 */
function ReverseEnsProvider({
  children,
  limitEnsNames = ENS_RESOLVE_BATCH_SIZE,
}) {
  const { resolveMeta } = useContext(ResolverEnsContext)
  const [ensByAddress, dispatch] = useReducer(reverseEnsReducer, {})
  const cacheEnsByAddress = useRef({})

  // FIXME
  cacheEnsByAddress.current = ensByAddress

  // Number of ENS names to resolve at a time.
  const batchSize = useMemo(
    () => limitEnsNames ?? ENS_RESOLVE_BATCH_SIZE,
    [limitEnsNames]
  )

  const resolveNames = useCallback(
    /**
     * @param {string[]} names
     * @param {string[]} addresses
     */
    async (names, addresses) => {
      let promise = new Promise((r) => r(undefined))
      for (let i = 0; i < names.length; i += batchSize) {
        promise = promise.then(
          () => Promise.allSettled(
            names.slice(i, i + batchSize).map(
              (name) => resolveMeta(name, addresses ? addresses[i] : undefined)
            )
          )
        )
      }
      await promise
    },
    [batchSize, resolveMeta]
  )

  const resolveEnsNames = useCallback(
    /**
     * @param {string[]} addresses
     * @param {boolean} resolve
     * @returns {Promise<Record<string, string>>}
     */
    async (addresses, resolve = false) => {
      if (addresses.length === 0) {
        return {}
      }
      const oldAddresses = Object.keys(cacheEnsByAddress.current)
      const givenOldAddresses = addresses.filter(
        (address) => oldAddresses.includes(address)
      )
      if (givenOldAddresses.length > 0 && resolve) {
        resolveNames(
          givenOldAddresses.map(
            (address) => cacheEnsByAddress.current[address]
          ),
          givenOldAddresses
        )
      }
      const newAddresses = addresses.filter(
        (address) => !oldAddresses.includes(address)
      )
      const ensNames = await ethereumResolveEnsNames(
        newAddresses,
        (resolved) => {
          dispatch({ newEnsByAddress: resolved })
          if (resolve) {
            const [resolvedAddresses, resolvedEnsNames] = Object
              .entries(resolved)
              .reduce(
                /**
                 * @param {[string[], string[]]} param0
                 * @param {[string, string]} param1
                 * @returns {[string[], string[]]}
                 */
                ([resolvedAddresses, resolvedEnsNames], [address, ensName]) => [
                  [...resolvedAddresses, address],
                  [...resolvedEnsNames, ensName]
                ],
                [[], []]
              )
            resolveNames(resolvedEnsNames, resolvedAddresses)
          }
        }
      )
      dispatch({
        type: 'prepend',
        newEnsByAddress: newAddresses
          .filter((address) => !(address in ensNames))
          .reduce(
            (notFoundEnsByAddress, notFoundAddress) => ({
              ...notFoundEnsByAddress,
              [notFoundAddress]: null,
            }),
            {}
          )
      })
      return Object.fromEntries(
        addresses
          .map(
            (address) => ([
              address,
              ensNames[address] ?? null,
            ])
          )
          .filter(([_, value]) => value)
      )
    },
    [resolveNames]
  )

  const setEnsName = useCallback(
    /**
     * @param {string} address
     * @param {string} ensName
     */
    (address, ensName) => {
      dispatch({ newEnsByAddress: { [address]: ensName } })
    },
    []
  )

  const getEnsName = useCallback(
    /**
     * @param {string} address
     */
    (address) => {
      return cacheEnsByAddress.current[address] ?? null
    },
    []
  )

  const isAddressEnsNotFound = useCallback(
    /**
     * @param {string} address
     * @returns {boolean}
     */
    (address) => {
      return cacheEnsByAddress.current[address] === null
    },
    []
  )

  const value = useMemo(
    () => ({
      resolveEnsNames,
      setEnsName,
      getEnsName,
      isAddressEnsNotFound,
    }),
    [resolveEnsNames, setEnsName, getEnsName, isAddressEnsNotFound]
  )

  return (
    <ReverseEnsContext.Provider value={value}>
      {children}
    </ReverseEnsContext.Provider>
  )
}

ReverseEnsProvider.propTypes = {
  children: PropTypes.node.isRequired,
  limitEnsNames: PropTypes.number,
}

/**
 * @param {PropTypes.InferProps<EnsProvider.propTypes>} props
 */
export function EnsProvider({ children }) {
  return (
    <ResolverEnsProvider>
      <ReverseEnsProvider>
        {children}
      </ReverseEnsProvider>
    </ResolverEnsProvider>
  )
}

EnsProvider.propTypes = {
  children: PropTypes.node.isRequired,
}
