export default function SectionTabs({ sections, activeSection, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {sections.map((section) => (
        <button
          key={section.key}
          type="button"
          onClick={() => onSelect(section.key)}
          className={`rounded-full px-4 py-2 text-sm ${activeSection === section.key ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950/80 text-slate-200 hover:bg-slate-900'}`}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}
