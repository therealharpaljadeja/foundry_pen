import React, { useState, useEffect } from 'react';

const TableOfContents = () => {
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '0px 0px -80% 0px' }
    );

    document.querySelectorAll('h2[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-auto p-4 bg-[#1C1E24] rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-[#61DAFB]">On This Page</h3>
      <ul className="space-y-2">
        {['overview', 'init-project', 'evaluate-storage', 'deploy-contract', 'evaluate-deployed', 'increment-counter', 'evaluate-again', 'further-resources'].map((section) => (
          <li key={section}>
            <a
              href={`#${section}`}
              className={`block text-sm ${
                activeSection === section ? 'text-[#61DAFB]' : 'text-gray-400 hover:text-white'
              }`}
            >
              {section.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;