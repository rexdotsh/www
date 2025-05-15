import Navigation from '../Navigation';
import { asciiArt } from './ascii-art';

const AsciiArt = () => {
  return (
    <div className="h-full flex justify-center flex-col items-center">
      <pre className="select-none text-[2.8px] md:text-[3.2px] leading-[1.4px] md:leading-[1.6px] text-rose-500 text-center mx-auto fade-in">
        {asciiArt}
      </pre>
      <div className="fade-in">
        <Navigation />
      </div>
    </div>
  );
};

export default AsciiArt;
