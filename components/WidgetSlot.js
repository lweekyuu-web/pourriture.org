export default function WidgetSlot({ widgets }) {
  if (!widgets || widgets.length === 0) return null;
  return (
    <div className="widget-slot">
      {widgets.map((w) => (
        <div className="widget" key={w.id}>
          {w.type === 'html' ? (
            <div dangerouslySetInnerHTML={{ __html: w.htmlContent || '' }} />
          ) : (
            <a href={`/api/widgets/click/${w.id}`} rel="sponsored noopener" target="_blank">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={w.imageUrl} alt={w.altText || 'advertisement'} className="widget-banner-img" />
            </a>
          )}
          <div className="widget-tag">advertisement</div>
        </div>
      ))}
    </div>
  );
}
