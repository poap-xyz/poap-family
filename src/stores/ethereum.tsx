import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { ENS_RESOLVE_BATCH_SIZE, EnsMeta } from 'models/ethereum'
import {
  resolveAddress as ethereumResolveAddress,
  resolveEnsNames as ethereumResolveEnsNames,
  resolveEnsAvatar as ethereumResolveEnsAvatar
} from 'loaders/ethereum'

export const ResolverEnsContext = createContext<{
  resolveAddress: (ensName: string) => Promise<string | null>
  getAddress: (ensName: string) => string | null
  isEnsAddressFound: (ensName: string) => boolean
  isEnsAddressNotFound: (ensName: string) => boolean
  resolveMeta: (ensName: string, address?: string) => Promise<EnsMeta>
  getMeta: (ensName: string) => EnsMeta
}>({
  resolveAddress: async (ensName: string): Promise<string | null> => null,
  getAddress: (ensName: string): string | null => null,
  isEnsAddressFound: (ensName: string): boolean => false,
  isEnsAddressNotFound: (ensName: string): boolean => false,
  resolveMeta: async (ensName: string, address?: string): Promise<EnsMeta> => ({ avatar: null }),
  getMeta: (ensName: string): EnsMeta => null,
})

export const ReverseEnsContext = createContext<{
  resolveEnsNames: (addresses: string[], resolve?: boolean) => Promise<Record<string, string>>
  setEnsName: (address: string, ensName: string) => void
  getEnsName: (address: string) => string | null
  isAddressEnsNotFound: (address: string) => boolean
}>({
  resolveEnsNames: async (addresses: string[], resolve = false): Promise<Record<string, string>> => ({}),
  setEnsName: (address: string, ensName: string): void => {},
  getEnsName: (address: string): string | null => null,
  isAddressEnsNotFound: (address: string): boolean => false,
})

function resolverEnsReducer(
  dataByEnsName: Record<string, {
    address: string | null
    avatar: string | null
  }>,
  {
    ensName,
    address,
    avatar,
  }: {
    ensName: string
    address?: string | null
    avatar?: string | null
  },
) {
  return {
    ...dataByEnsName,
    [ensName]: {
      address: address ?? dataByEnsName[ensName]?.address,
      avatar: avatar ?? dataByEnsName[ensName]?.avatar,
    },
  }
}

function ResolverEnsProvider({ children }: { children: ReactNode }) {
  const [dataByEnsName, dispatch] = useReducer(resolverEnsReducer, {})
  const cacheDataByEnsName = useRef({})

  // FIXME
  cacheDataByEnsName.current = dataByEnsName

  const getAddress = useCallback(
    (ensName: string) => {
      return cacheDataByEnsName.current[ensName]?.address ?? null
    },
    []
  )

  const isEnsAddressFound = useCallback(
    (ensName: string) => {
      return cacheDataByEnsName.current[ensName]?.address != null
    },
    []
  )

  const isEnsAddressNotFound = useCallback(
    (ensName: string) => {
      return cacheDataByEnsName.current[ensName]?.address === null
    },
    []
  )

  const resolveAddress = useCallback(
    async (ensName: string): Promise<string | null> => {
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
    async (ensName: string, address?: string): Promise<string | null> => {
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
    (ensName: string): { avatar: string | null } => {
      const avatar = dataByEnsName[ensName]?.avatar ?? null
      return { avatar }
    },
    [dataByEnsName]
  )

  const resolveMeta = useCallback(
    async (ensName: string, address: string): Promise<EnsMeta> => {
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

const reverseEnsReducer = (
  ensByAddress: Record<string, string | null>,
  {
    type = 'append',
    newEnsByAddress,
  }: { type?: 'prepend' | 'append'; newEnsByAddress: Record<string, string | null> }
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

function ReverseEnsProvider({
  children,
  limitEnsNames = ENS_RESOLVE_BATCH_SIZE,
}: {
  children: ReactNode
  limitEnsNames?: number
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
    async (names: string[], addresses: string[]) => {
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
    async (addresses: string[], resolve: boolean = false): Promise<Record<string, string>> => {
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
                ([resolvedAddresses, resolvedEnsNames]: [string[], string[]], [address, ensName]: [string, string]): [string[], string[]] => [
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
    (address: string, ensName: string) => {
      dispatch({ newEnsByAddress: { [address]: ensName } })
    },
    []
  )

  const getEnsName = useCallback(
    (address: string) => {
      return cacheEnsByAddress.current[address] ?? null
    },
    []
  )

  const isAddressEnsNotFound = useCallback(
    (address: string): boolean => {
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

export function EnsProvider({ children }: { children: ReactNode }) {
  return (
    <ResolverEnsProvider>
      <ReverseEnsProvider>
        {children}
      </ReverseEnsProvider>
    </ResolverEnsProvider>
  )
}
