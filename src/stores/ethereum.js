import PropTypes from 'prop-types'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ENS_RESOLVE_BATCH_SIZE } from 'models/ethereum'
import {
  resolveAddress as ethereumResolveAddress,
  resolveEnsNames as ethereumResolveEnsNames,
  resolveEnsAvatar as ethereumResolveEnsAvatar
} from 'loaders/ethereum'

export const ResolverEnsContext = createContext({
  /**
   * @type {Record<string, string | null>}
   */
  addresses: {},
  /**
   * @type {(ensName: string) => Promise<string | null>}
   */
  resolveAddress: async (ensName) => null,
  /**
   * @type {Record<string, string | null>}
   */
  avatars: {},
  /**
   * @type {(ensName: string, address?: string) => Promise<{ avatar: string | null }>}
   */
  resolveMeta: async (ensName, address) => ({ avatar: null }),
})

export const ReverseEnsContext = createContext({
  /**
   * @type {Record<string, string>}
   */
  ensNames: {},
  /**
   * @type {(addresses: string[], resolve?: boolean) => Promise<Record<string, string>>}
   */
  resolveEnsNames: async (addresses, resolve = false) => ({}),
  /**
   * @type {(address: string, ensName: string) => void}
   */
  setEnsName: (address, ensName) => {},
  /**
   * @type {(address: string) => boolean}
   */
  isAddressEndNotFound: (address) => false,
})

/**
 * @param {PropTypes.InferProps<ResolverEnsProvider.propTypes>} props
 */
function ResolverEnsProvider({ children }) {
  /**
   * @type {ReturnType<typeof useState<Record<string, string | null>>>}
   */
  const [addressByEnsName, setAddressByEnsName] = useState({})
  /**
   * @type {ReturnType<typeof useState<Record<string, string | null>>>}
   */
  const [avatarByEnsName, setAvatarByEnsName] = useState({})

  const resolveAddress = useCallback(
    /**
     * @param {string} ensName
     * @returns {Promise<string | null>}
     */
    async (ensName) => {
      if (Object.keys(addressByEnsName).includes(ensName)) {
        return addressByEnsName[ensName]
      }
      const address = await ethereumResolveAddress(ensName)
      if (address) {
        setAddressByEnsName((oldAddressByEnsName) => ({
          ...oldAddressByEnsName,
          [ensName]: address,
        }))
      } else {
        setAddressByEnsName((oldAddressByEnsName) => ({
          ...(oldAddressByEnsName ?? {}),
          [ensName]: null,
        }))
      }
      return address
    },
    [addressByEnsName]
  )

  const resolveAvatar = useCallback(
    /**
     * @param {string} ensName
     * @param {string} [address]
     * @returns {Promise<string | null>}
     */
    async (ensName, address) => {
      if (Object.keys(avatarByEnsName).includes(ensName)) {
        return avatarByEnsName[ensName]
      }
      let avatar = await ethereumResolveEnsAvatar(ensName)
      if (!avatar && address) {
        avatar = await ethereumResolveEnsAvatar(address)
      }
      if (avatar) {
        setAvatarByEnsName((oldAvatarByEnsName) => ({
          ...oldAvatarByEnsName,
          [ensName]: avatar,
        }))
      } else {
        setAvatarByEnsName((oldAvatarByEnsName) => ({
          ...(oldAvatarByEnsName ?? {}),
          [ensName]: null,
        }))
      }
      return avatar
    },
    [avatarByEnsName]
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
      addresses: addressByEnsName,
      resolveAddress,
      avatars: avatarByEnsName,
      resolveMeta,
    }),
    [addressByEnsName, resolveAddress, avatarByEnsName, resolveMeta]
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
 * @param {PropTypes.InferProps<ReverseEnsProvider.propTypes>} props
 */
function ReverseEnsProvider({
  children,
  limitEnsNames = ENS_RESOLVE_BATCH_SIZE,
}) {
  const { resolveMeta } = useContext(ResolverEnsContext)

  /**
   * @type {ReturnType<typeof useState<Record<string, string>>>}
   */
  const [ensByAddress, setEnsByAddress] = useState({})

  /**
   * @type {ReturnType<typeof useState<string[]>>}
   */
  const [notFoundAddresses, setNotFoundAddresses] = useState([])

  // Number of ENS names to resolve at a time.
  const batchSize = useMemo(
    () => limitEnsNames ?? ENS_RESOLVE_BATCH_SIZE,
    [limitEnsNames]
  )

  const resolveNames = useCallback(
    /**
     * @param {string[]} names
     * @param {string[]} addresses
     * @returns {Promise<void>}
     */
    (names, addresses) => {
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
      return promise.then(() => {})
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
      const oldAddresses = Object.keys(ensByAddress)
      const givenOldAddresses = oldAddresses.filter(
        (address) => oldAddresses.includes(address)
      )
      if (givenOldAddresses.length > 0 && resolve) {
        resolveNames(
          givenOldAddresses.map((address) => ensByAddress[address]),
          givenOldAddresses
        )
      }
      const newAddresses = addresses.filter(
        (address) => !oldAddresses.includes(address)
      )
      const ensNames = await ethereumResolveEnsNames(
        newAddresses,
        (resolved) => {
          setEnsByAddress((oldEnsByAddress) => ({
            ...oldEnsByAddress,
            ...resolved,
          }))
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
      setNotFoundAddresses(
        (oldNotFoundByAddress) => ([
          ...new Set([
            ...(oldNotFoundByAddress ?? []),
            ...newAddresses.filter((address) => !(address in ensNames)),
          ])
        ])
      )
      return Object.fromEntries(
        addresses
          .map(
            (address) => ([
              address,
              ensNames[address] ?? ensByAddress[address] ?? null,
            ])
          )
          .filter(([_, value]) => value)
      )
    },
    [ensByAddress, resolveNames]
  )

  /**
   * @param {string} address
   * @param {string} ensName
   */
  function setEnsName(address, ensName) {
    setEnsByAddress((oldEnsByAddress) => ({
      ...oldEnsByAddress,
      [address]: ensName,
    }))
  }

  const isAddressEndNotFound = useCallback(
    /**
     * @param {string} address
     * @returns {boolean}
     */
    (address) => {
      return notFoundAddresses.indexOf(address) !== -1
    },
    [notFoundAddresses]
  )

  const value = useMemo(
    () => ({
      ensNames: ensByAddress,
      resolveEnsNames,
      setEnsName,
      isAddressEndNotFound,
    }),
    [ensByAddress, isAddressEndNotFound, resolveEnsNames]
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
