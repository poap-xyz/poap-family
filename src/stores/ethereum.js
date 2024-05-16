import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ENS_RESOLVE_BATCH_SIZE } from '../models/ethereum'
import {
  resolveAddress as ethereumResolveAddress,
  resolveEnsNames as ethereumResolveEnsNames,
  resolveEnsAvatar as ethereumResolveEnsAvatar
} from '../loaders/ethereum'

export const ResolverEnsContext = createContext({
  addresses: {},
  resolveAddress: async (ensName) => '',
  avatars: {},
  resolveMeta: async (ensName, address) => {},
  resolve: async (ensName, full = false) => {},
})

export const ReverseEnsContext = createContext({
  ensNames: {},
  resolveEnsNames: async (addresses, resolve = false) => {},
  setEnsName: (address, ensName) => {},
  isNotFound: (address) => false,
})

function ResolverEnsProvider({ children }) {
  const [addressByEnsName, setAddressByEnsName] = useState({})
  const [avatarByEnsName, setAvatarByEnsName] = useState({})

  const resolveAddress = useCallback(
    async (ensName) => {
      if (Object.keys(addressByEnsName).indexOf(ensName) !== -1) {
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
          ...oldAddressByEnsName,
          [ensName]: null,
        }))
      }
      return address
    },
    [addressByEnsName]
  )

  const resolveAvatar = useCallback(
    async (ensName, address) => {
      if (Object.keys(avatarByEnsName).indexOf(ensName) !== -1) {
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
          ...oldAvatarByEnsName,
          [ensName]: null,
        }))
      }
      return avatar
    },
    [avatarByEnsName]
  )

  const resolveMeta = useCallback(
    async (ensName, address) => {
      const avatar = await resolveAvatar(ensName, address)
      return { avatar }
    },
    [resolveAvatar]
  )

  const resolve = useCallback(
    async (ensName, full = false) => {
      if (full) {
        const address = await resolveAddress(ensName)
        const meta = await resolveMeta(ensName, address)
        return { address, meta }
      } else {
        return await resolveAddress(ensName)
      }
    },
    [resolveAddress, resolveMeta]
  )

  const value = useMemo(
    () => ({
      addresses: addressByEnsName,
      resolveAddress,
      avatars: avatarByEnsName,
      resolveMeta,
      resolve,
    }),
    [addressByEnsName, resolveAddress, avatarByEnsName, resolveMeta, resolve]
  )

  return (
    <ResolverEnsContext.Provider value={value}>
      {children}
    </ResolverEnsContext.Provider>
  )
}

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

  const resolveNames = useCallback(
    (names, addresses) => {
      let promise = new Promise((r) => r())
      for (let i = 0; i < names.length; i += limitEnsNames) {
        promise = promise.then(
          () => Promise.allSettled(
            names.slice(i, i + limitEnsNames).map(
              (name) => resolveMeta(name, addresses ? addresses[i] : undefined)
            )
          )
        )
      }
      return promise
    },
    [limitEnsNames, resolveMeta]
  )

  const resolveEnsNames = useCallback(
    async (addresses, resolve = false) => {
      const oldAddresses = Object.keys(ensByAddress)
      const givenOldAddresses = oldAddresses.filter(
        (address) => oldAddresses.indexOf(address) !== -1
      )
      if (givenOldAddresses.length > 0 && resolve) {
        resolveNames(
          givenOldAddresses.map((address) => ensByAddress[address]),
          givenOldAddresses
        )
      }
      const newAddresses = addresses.filter(
        (address) => oldAddresses.indexOf(address) === -1
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
                ([resolvedAddresses, resolvedEnsNames], [address, ensName]) => [
                  [...resolvedAddresses, address],
                  [...resolvedEnsNames, ensName]
                ]
              )
            resolveNames(resolvedEnsNames, resolvedAddresses)
          }
        }
      )
      setNotFoundAddresses(
        (oldNotFoundByAddress) => ([
          ...new Set([
            ...oldNotFoundByAddress,
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

  function set(address, ensName) {
    setEnsByAddress((oldEnsByAddress) => ({
      ...oldEnsByAddress,
      [address]: ensName,
    }))
  }

  const isNotFound = useCallback(
    (address) => {
      return notFoundAddresses.indexOf(address) !== -1
    },
    [notFoundAddresses]
  )

  const value = useMemo(
    () => ({
      ensNames: ensByAddress,
      resolveEnsNames,
      setEnsName: set,
      isNotFound,
    }),
    [ensByAddress, isNotFound, resolveEnsNames]
  )

  return (
    <ReverseEnsContext.Provider value={value}>
      {children}
    </ReverseEnsContext.Provider>
  )
}

export function EnsProvider({ children }) {
  return (
    <ResolverEnsProvider>
      <ReverseEnsProvider>
        {children}
      </ReverseEnsProvider>
    </ResolverEnsProvider>
  )
}
