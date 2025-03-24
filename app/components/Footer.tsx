const Footer = () => {
  return (
    <footer className="absolute bottom-0 w-full py-4 px-6 text-center text-neutral-500 text-sm md:text-base">
      <div className="flex justify-center items-center space-x-3 transition-colors duration-300 hover:text-neutral-300">
        <span>© {new Date().getFullYear()}</span>
        <span className="text-rose-400/80">•</span>
        <span>rex@unreal:~#</span>
      </div>
    </footer>
  );
};

export default Footer;
