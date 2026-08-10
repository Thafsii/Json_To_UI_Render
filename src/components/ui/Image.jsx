export default function Image({ src, alt }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-2">
      <img src={src} alt={alt || 'Image'} className="w-full rounded-lg object-contain" />
    </div>
  );
}
