import {HttpStatusCode} from "@solidjs/start";
import {Component} from "solid-js";

const NotFoundPage: Component = () => {
  return (
    <>
      <HttpStatusCode code={404} />
      <main class="fixed inset-0 overflow-hidden">
        <div class="h-full flex justify-center flex-col items-center font-mono">
          <p class="text-3xl text-rose-400/80">404</p>
          <p class="text-[#d6e9ef] mt-4 text-lg">page not found</p>
          <a href="/" class="mt-4 text-[#6e7681] hover:text-[#d6e9ef] transition-colors duration-200 text-lg">
            return home
          </a>
        </div>
      </main>
    </>
  );
};

export default NotFoundPage;
