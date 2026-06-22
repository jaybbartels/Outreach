'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Domain {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color_scheme: string;
}

export default function DomainSelector() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [currentDomain, setCurrentDomain] = useState<string>('healthcare');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetchDomains();
    const domain = searchParams.get('domain') || 'healthcare';
    setCurrentDomain(domain);
  }, [searchParams]);

  const fetchDomains = async () => {
    try {
      const response = await fetch('/api/domains');
      const { data } = await response.json();
      setDomains(data || []);
    } catch (error) {
      console.error('Error fetching domains:', error);
    }
  };

  const handleDomainChange = (slug: string) => {
    setCurrentDomain(slug);
    router.push(`/?domain=${slug}`);
  };

  return (
    <div className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <p className="text-xs font-semibold text-gray-600 mb-2 uppercase">
          Research Domain:
        </p>
        <div className="flex gap-2 flex-wrap">
          {domains.map((domain) => (
            <button
              key={domain.slug}
              onClick={() => handleDomainChange(domain.slug)}
              className={`px-4 py-2 rounded-lg transition font-medium ${
                currentDomain === domain.slug
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-900 border hover:border-blue-300'
              }`}
            >
              <span className="mr-2">{domain.icon}</span>
              {domain.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
