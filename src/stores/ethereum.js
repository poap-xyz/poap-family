import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { ENS_RESOLVE_BATCH_SIZE } from '../models/ethereum'
import {
  resolveAddress as ethereumResolveAddress,
  resolveEnsNames as ethereumResolveEnsNames,
  resolveEnsAvatar as ethereumResolveEnsAvatar
} from '../loaders/ethereum'

const ResolverEnsContext = createContext({
  addresses: {},
  resolveAddress: async (ensName) => {},
  avatars: {},
  resolveMeta: async (ensName) => {},
  resolve: async (ensName, full = false) => {},
})

const ReverseEnsContext = createContext({
  ensNames: {},
  resolveEnsNames: async (addresses, resolve = false) => {},
  setEnsName: (address, ensName) => {},
  isNotFound: (address) => {},
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
        setAddressByEnsName((oldAddressByEnsName) => ({ ...oldAddressByEnsName, [ensName]: address }))
      } else {
        setAddressByEnsName((oldAddressByEnsName) => ({ ...oldAddressByEnsName, [ensName]: null }))
      }
      return address
    },
    [addressByEnsName]
  )
  const resolveAvatar = useCallback(
    async (ensName) => {
      if (Object.keys(avatarByEnsName).indexOf(ensName) !== -1) {
        return avatarByEnsName[ensName]
      }
      const avatar = await ethereumResolveEnsAvatar(ensName)
      if (avatar) {
        setAvatarByEnsName((oldAvatarByEnsName) => ({ ...oldAvatarByEnsName, [ensName]: avatar }))
      } else {
        setAvatarByEnsName((oldAvatarByEnsName) => ({ ...oldAvatarByEnsName, [ensName]: null }))
      }
      return avatar
    },
    [avatarByEnsName]
  )
  const resolveMeta = useCallback(
    async (ensName) => {
      const avatar = await resolveAvatar(ensName)
      return { avatar }
    },
    [resolveAvatar]
  )
  const resolve = useCallback(
    async (ensName, full = false) => {
      const [address, meta] = await Promise.all([
        resolveAddress(ensName),
        resolveMeta(ensName),
      ])
      if (full) {
        return { address, meta }
      } else {
        return address
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
  const [ensByAddress, setEnsByAddress] = useState({})
  const [notFoundAddresses, setNotFoundAddresses] = useState([])
  const resolveNames = useCallback(
    (names) => {
      let promise = new Promise((r) => r())
      for (let i = 0; i < names.length; i += limitEnsNames) {
        promise = promise.then(
          () => Promise.allSettled(
            names.slice(i, i + limitEnsNames).map((name) => resolveMeta(name))
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
      const givenOldAddresses = oldAddresses.filter((address) => oldAddresses.indexOf(address) !== -1)
      if (givenOldAddresses.length > 0 && resolve) {
        resolveNames(givenOldAddresses.map((address) => ensByAddress[address]))
      }
      const newAddresses = addresses.filter((address) => oldAddresses.indexOf(address) === -1)
      const ensNames = await ethereumResolveEnsNames(newAddresses, (resolved) => {
        setEnsByAddress((oldEnsByAddress) => ({ ...oldEnsByAddress, ...resolved }))
        if (resolve) {
          resolveNames(Object.values(resolved))
        }
      })
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
            (address) => ([address, ensNames[address] ?? ensByAddress[address] ?? null])
          )
          .filter(([_, value]) => value)
      )
    },
    [ensByAddress, resolveNames]
  )
  function set(address, ensName) {
    setEnsByAddress((oldEnsByAddress) => ({ ...oldEnsByAddress, [address]: ensName }))
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

function EnsProvider({ children }) {
  return (
    <ResolverEnsProvider>
      <ReverseEnsProvider>
        {children}
      </ReverseEnsProvider>
    </ResolverEnsProvider>
  )
}

export {
  ReverseEnsContext,
  ResolverEnsContext,
  EnsProvider,
}
