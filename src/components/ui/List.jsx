export default function List({ items }) {
  return (
    <ul className="list-disc space-y-2 pl-5 text-slate-200">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}
