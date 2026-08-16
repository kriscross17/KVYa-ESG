import { HelpCircle } from 'lucide-react';

export default function HelpCard({ title = 'How to use this', items }) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5 sm:p-6 mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-full">
          <HelpCircle className="w-6 h-6 text-blue-700" />
        </div>
        <h2 className="text-lg font-bold text-blue-900">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-base text-blue-900">
            <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
