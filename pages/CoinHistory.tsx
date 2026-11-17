import { Link, useLocation } from "react-router-dom";

/** Temporary destination for the coin-balance and Help actions. */
export function CoinHistory() {
  const location = useLocation();
  return (
    <div className="min-h-dvh bg-black px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-white">
      <Link
        to={{ pathname: "/coins", search: location.search }}
        className="inline-flex min-h-11 items-center text-[14px] font-medium text-[#E9E7E9]"
      >
        Back
      </Link>
      <h1 className="mt-6 text-[20px] font-medium text-[#E9E7E9]">
        Coin history
      </h1>
      <p className="mt-2 text-[14px] leading-5 text-white/70">
        Your coin history will show here.
      </p>
    </div>
  );
}
