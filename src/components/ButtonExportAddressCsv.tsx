import download from 'downloadjs'
import { Download } from 'iconoir-react'
import { ReactNode, useContext } from 'react'
import { ReverseEnsContext } from 'stores/ethereum'
import Button from 'components/Button'

function ButtonExportAddressCsv({
  name,
  filename = 'collectors',
  addresses,
  children,
  title,
}: {
  name?: string
  filename?: string
  addresses?: string[]
  children?: ReactNode
  title?: string
}) {
  const { getEnsName } = useContext(ReverseEnsContext)

  const handleExportCsv = () => {
    if (addresses == null) {
      return
    }
    let csv = 'address,ens\n'
    for (const address of addresses) {
      csv += `${address},${getEnsName(address) ?? ''}\n`
    }
    download(csv, `${filename}.csv`, 'text/csv')
    const href = new URL(window.location.href)
    href.search = ''
    href.pathname += `/${filename}.csv`
    if (name) {
      href.hash = name
    }
  }

  return (
    <Button
      title={title}
      icon={<Download />}
      secondary={true}
      loading={addresses == null}
      onClick={handleExportCsv}
    >
      {children ?? 'export csv'}
    </Button>
  )
}

export default ButtonExportAddressCsv
