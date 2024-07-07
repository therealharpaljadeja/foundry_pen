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
      { rootMargin: '-20% 0% -35% 0%', threshold: 0.1 }
    );

    document.querySelectorAll('section[id]').forEach((section) => {
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const sections = [
    { id: 'overview', title: 'Overview' },
    { id: 'init-project', title: 'Initialize Project' },
    { id: 'evaluate-storage', title: 'Evaluate Storage' },
    { id: 'deploy-contract', title: 'Deploy Contract' },
    { id: 'evaluate-deployed', title: 'Evaluate Deployed' },
    { id: 'increment-counter', title: 'Increment Counter' },
    { id: 'evaluate-again', title: 'Evaluate Again' },
    { id: 'further-resources', title: 'Further Resources' }
  ];

  return (
    <nav className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-auto p-4 bg-[#1C1E24] rounded-lg">
      <h3 className="text-lg font-semibold mb-2 text-[#61DAFB]">On This Page</h3>
      <ul className="space-y-2">
        {sections.map(({ id, title }) => (
          <li key={id}>
            <a
              href={`#${id}`}
              className={`block text-sm transition-colors duration-200 ${
                activeSection === id
                  ? 'text-[#61DAFB] font-medium'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TableOfContents;