// import { useState } from 'react'
// import { INCOMMON_DROPS_LIMIT, InCommonCount } from 'models/in-common'
// import {
//   fetchDropsInCommonTotal as loadDropsInCommonTotal,
//   fetchDropsInCommonCounts as loadDropsInCommonCounts,
// } from 'services/in-common'

// function useDropsInCommonCounts(
//   dropIds: number[],
//   limit: number = INCOMMON_DROPS_LIMIT,
// ): {
//   loadingInCommonTotal: boolean
//   loadingInCommonCounts: boolean
//   errors: Error[]
//   dropsInCommonTotal: number | null
//   dropsInCommonCounts: InCommonCount[]
//   fetchDropsInCommonTotal: () => () => void
//   fetchDropsInCommonCounts: (offset: number) => () => void
// } {
//   const [loadingInCommonTotal, setLoadingInCommonTotal] = useState<boolean>(false)
//   const [loadingInCommonCounts, setLoadingInCommonCounts] = useState<boolean>(false)
//   const [errors, setErrors] = useState<Error[]>([])
//   const [dropsInCommonTotal, setDropsInCommonTotal] = useState<number | null>(null)
//   const [dropsInCommonCounts, setDropsInCommonCounts] = useState<InCommonCount[]>([])

//   const addError = (err: unknown, message: string) => {
//     setErrors((prevErrors) => [
//       ...prevErrors,
//       err instanceof Error ? err : new Error(message, { cause: err }),
//     ])
//   }

//   const fetchDropsInCommonTotal = () => {
//     const controller = new AbortController()

//     setLoadingInCommonTotal(true)
//     loadDropsInCommonTotal(dropIds, controller.signal).then((total) => {
//       setDropsInCommonTotal(total)
//     }).catch((err) => {
//       addError(err, `Cannot fetch drops in common total: ${err}`)
//     }).finally(() => {
//       setLoadingInCommonTotal(false)
//     })

//     return () => {
//       controller.abort()

//       setLoadingInCommonTotal(false)
//     }
//   }

//   const fetchDropsInCommonCounts = (offset: number) => {
//     const controller = new AbortController()

//     setLoadingInCommonCounts(true)
//     loadDropsInCommonCounts(
//       dropIds,
//       offset,
//       limit,
//       controller.signal
//     ).then((inCommonCounts) => {
//       setDropsInCommonCounts((prevInCommonCounts) => [
//         ...prevInCommonCounts,
//         ...inCommonCounts,
//       ])
//     }).catch((err) => {
//       addError(err, `Cannot fetch drops in common conuts: ${err}`)
//     }).finally(() => {
//       setLoadingInCommonCounts(false)
//     })

//     return () => {
//       controller.abort()

//       setLoadingInCommonCounts(true)
//     }
//   }

//   return {
//     loadingInCommonTotal,
//     loadingInCommonCounts,
//     errors,
//     dropsInCommonTotal,
//     dropsInCommonCounts,
//     fetchDropsInCommonTotal,
//     fetchDropsInCommonCounts,
//   }
// }

// export default useDropsInCommonCounts

