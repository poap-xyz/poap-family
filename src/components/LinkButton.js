import '../styles/link-button.css'

function LinkButton({ icon, href, children, external = false, secondary = false }) {
  return (
    <a href={href} className={`link-button ${secondary ? 'secondary' : 'primary'}`} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>
      <span className="link-button-content">
        {icon && (
          <span className="link-button-icon">
            {icon}
          </span>
        )}
        {external && (
          <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg" className="external">
            <path d="M6.25622 0.0429688C5.84496 0.0429688 5.51157 0.442321 5.51157 0.934947C5.51157 1.42757 5.84496 1.82693 6.25622 1.82693H8.18171L3.49575 7.44005C3.20494 7.78839 3.20494 8.35316 3.49575 8.7015C3.78655 9.04984 4.25803 9.04984 4.54883 8.7015L9.23479 3.08837V5.39484C9.23479 5.88747 9.56818 6.28682 9.97943 6.28682C10.3907 6.28682 10.7241 5.88747 10.7241 5.39484V0.934947C10.7241 0.442321 10.3907 0.0429688 9.97943 0.0429688H6.25622Z" fill="#473e6b" />
            <path d="M1.78836 1.82693C0.965849 1.82693 0.299072 2.62563 0.299072 3.61088V10.7467C0.299072 11.732 0.965848 12.5307 1.78836 12.5307H7.7455C8.56801 12.5307 9.23479 11.732 9.23479 10.7467V8.07078C9.23479 7.57815 8.9014 7.1788 8.49015 7.1788C8.07889 7.1788 7.7455 7.57815 7.7455 8.07078V10.7467H1.78836V3.61088L4.02229 3.61088C4.43354 3.61088 4.76693 3.21153 4.76693 2.7189C4.76693 2.22628 4.43354 1.82693 4.02229 1.82693H1.78836Z" fill="#473e6b" />
          </svg>
        )}
        {children}
      </span>
    </a>
  )
}

export default LinkButton
