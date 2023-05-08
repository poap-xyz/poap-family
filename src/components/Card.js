import '../styles/card.css'

function Card({ children, style }) {
  return (
    <section className="card">
      <div className="content" style={style}>
        {children}
      </div>
    </section>
  )
}

export default Card
