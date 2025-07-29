import { getHost } from '@/app/lib/utils';

const Navigation = async () => {
  const host = await getHost();

  const links = [
    { href: 'https://blog.rex.wf', text: 'BLOG' },
    ...(host === 'mridul.sh'
      ? [{ href: '/resume', text: 'RESUME' }]
      : [{ href: 'https://x.com/rexmkv', text: 'TWITTER' }]),
    { href: 'https://github.com/rexdotsh', text: 'GITHUB' },
    { href: 'https://flora.tf', text: 'FLORA' },
  ];

  return (
    <nav className="flex flex-col md:flex-row items-center gap-6 md:gap-12 mt-8 mb-36 md:mt-8 md:mb-0">
      {links.map(({ href, text }) => (
        <a
          key={href}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg md:text-2xl md:my-12 text-primary font-bold hover:text-rose-500/80 transition-colors"
        >
          {text}
        </a>
      ))}
    </nav>
  );
};

export default Navigation;
