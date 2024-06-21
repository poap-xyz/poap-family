import PropTypes from 'prop-types'
import download from 'downloadjs'
import { Download } from 'iconoir-react'
import { useContext } from 'react'
import { ReverseEnsContext } from 'stores/ethereum'
import Button from 'components/Button'

/**
 * @param {PropTypes.InferProps<ButtonExportAddressCsv.propTypes>} props
 */
function ButtonExportAddressCsv({
  name,
  filename = 'collectors',
  addresses = [],
  children,
  title,
}) {
  const { getEnsName } = useContext(ReverseEnsContext)

  const handleExportCsv = () => {
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
      onClick={handleExportCsv}
    >
      {children ?? 'export csv'}
    </Button>
  )
}

ButtonExportAddressCsv.propTypes = {
  name: PropTypes.string,
  filename: PropTypes.string,
  addresses: PropTypes.arrayOf(
    PropTypes.string.isRequired
  ).isRequired,
  children: PropTypes.node,
  title:  PropTypes.string,
}

export default ButtonExportAddressCsv
