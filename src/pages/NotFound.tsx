import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="fixed inset-0 z-[120] min-h-screen overflow-hidden bg-[#0078d7] px-[10vw] py-[14vh] text-white sm:px-[10.5vw] sm:py-[18vh]">
      <style>
        {`
          @keyframes bsod-eye-blink {
            0%, 5%, 100% {
              transform: scaleY(1);
              opacity: 1;
            }
            2.5% {
              transform: scaleY(0.08);
              opacity: 0.75;
            }
          }

          .bsod-eye {
            animation: bsod-eye-blink 4.8s steps(1, end) 5s infinite;
            transform-origin: center;
          }
        `}
      </style>

      <section className="max-w-[64rem] font-['Segoe_UI',Arial,sans-serif]">
        <div
          className="mb-8 flex items-center gap-[clamp(0.9rem,2.2vw,1.8rem)] text-[clamp(5.25rem,13vw,9.8rem)] font-light leading-none tracking-normal sm:mb-9"
          aria-label="Sad face"
        >
          <span className="grid h-[0.96em] grid-rows-2 items-center gap-[0.18em]" aria-hidden="true">
            <span className="bsod-eye block h-[0.105em] w-[0.105em] bg-white" />
            <span className="bsod-eye block h-[0.105em] w-[0.105em] bg-white" />
          </span>
          <span aria-hidden="true">(</span>
        </div>

        <h1 className="max-w-[58rem] font-['Segoe_UI',Arial,sans-serif] text-[clamp(1.9rem,4.1vw,3.35rem)] font-light leading-[1.44] tracking-normal">
          The page you are looking for doesn't seem to exist. I probably accidentally deleted it.
        </h1>

        <p className="mt-10 text-[clamp(1.1rem,2vw,1.6rem)] font-light leading-relaxed tracking-normal text-white/95 sm:mt-12">
          Go back to the home page{" "}
          <Link to="/" className="underline decoration-white/70 underline-offset-[0.2em] transition hover:text-white/75">
            here
          </Link>
          .
        </p>

        <div className="mt-12 space-y-5 text-[clamp(0.82rem,1.1vw,1rem)] font-light leading-relaxed tracking-normal text-white/90 sm:mt-14">
          <p>For more information about this issue and possible fixes, visit the missing page's previous location.</p>
          <p>
            Stop code: PAGE_NOT_FOUND
            <br />
            Error info: 0x00000404
          </p>
        </div>
      </section>
    </main>
  );
};

export default NotFound;
