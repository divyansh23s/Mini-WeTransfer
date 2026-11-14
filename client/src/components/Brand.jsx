export default function Brand({ compact = false }) {
  return (
    <a className={`brand${compact ? ' brand--compact' : ''}`} href="/" aria-label="Mini WeTransfer home">
      <span className="brand-mark" aria-hidden="true">mw</span>
      <span className="brand-wordmark">mini wetransfer</span>
    </a>
  );
}
