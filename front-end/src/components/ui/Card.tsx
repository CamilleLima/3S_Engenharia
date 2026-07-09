import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {title && (
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
