import { createContext, useState } from 'react'
import { resolveAddress, resolveEnsNames } from '../loaders/ethereum'

const ReverseEnsContext = createContext({})

function ReverseEnsProvider({ children }) {
  const [ensByAddress, setEnsByAddress] = useState({})
  const [notFoundAddresses, setNotFoundAddresses] = useState([])
  async function resolve(addresses) {
    const oldAddresses = Object.keys(ensByAddress)
    const newAddresses = addresses.filter((address) => oldAddresses.indexOf(address) === -1)
    const ensNames = await resolveEnsNames(newAddresses)
    const notFoundEnsNames = newAddresses.filter((address) => !(address in ensNames))
    setEnsByAddress((oldEnsByAddress) => ({ ...oldEnsByAddress, ...ensNames }))
    setNotFoundAddresses((oldNotFoundByAddress) => ([...new Set([...oldNotFoundByAddress, ...notFoundEnsNames])]))
    return Object.fromEntries(
      addresses
        .map(
          (address) => ([address, ensNames[address] ?? ensByAddress[address] ?? null])
        )
        .filter(([_, value]) => value)
    )
  }
  function set(address, ensName) {
    setEnsByAddress((oldEnsByAddress) => ({ ...oldEnsByAddress, [address]: ensName }))
  }
  function isNotFound(address) {
    return notFoundAddresses.indexOf(address) !== -1
  }
  return (
    <ReverseEnsContext.Provider value={{ ensNames: ensByAddress, resolveEnsNames: resolve, setEnsName: set, isNotFound }}>
      {children}
    </ReverseEnsContext.Provider>
  )
}

const EnsContext = createContext({})

function EnsProvider({ children }) {
  const [addressByEnsName, setAddressByEnsName] = useState({})
  async function resolve(ensName) {
    if (Object.keys(addressByEnsName).indexOf(ensName) !== -1) {
      return addressByEnsName[ensName]
    }
    const address = await resolveAddress(ensName)
    if (address) {
      setAddressByEnsName((oldAddressByEnsName) => ({ ...oldAddressByEnsName, [ensName]: address }))
    }
    return address
  }
  return (
    <EnsContext.Provider value={{ addresses: addressByEnsName, resolveAddress: resolve }}>
      {children}
    </EnsContext.Provider>
  )
}

export { ReverseEnsContext, ReverseEnsProvider, EnsContext, EnsProvider }
