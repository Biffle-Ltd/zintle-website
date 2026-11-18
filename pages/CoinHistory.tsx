import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { resolvePageAuthToken } from "../utils/authStorage";
import { HOST } from "../utils/host";
import { getOrganisationIdFromSearch } from "../utils/organisationIdFromUrl";
import {
  fetchWalletTransactionPage,
  formatWalletCoins,
  walletTransactionTitle,
  type WalletTransaction,
} from "../utils/walletTransactions";

const PAGE_SIZE = 30;

function signedCoins(transaction: WalletTransaction): string {
  const amount = formatWalletCoins(Math.abs(transaction.value));
  return transaction.transactionType === "debit" ? `-${amount}` : `+${amount}`;
}

export function CoinHistory() {
  const location = useLocation();
  const organisationId = getOrganisationIdFromSearch(
    location.search,
    location.pathname,
  );
  const token = resolvePageAuthToken(location.search, organisationId);
  const [rows, setRows] = useState<WalletTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    token ? "loading" : "ready",
  );
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    setStatus("loading");
    setRows([]);
    setPage(1);
    void fetchWalletTransactionPage(HOST, {
      organisationId,
      token,
      pageNo: 1,
      perPage: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        if (!result) {
          setStatus("error");
          return;
        }
        setRows(result.transactions);
        setTotal(result.total);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name === "AbortError") return;
        setStatus("error");
      });
    return () => controller.abort();
  }, [organisationId, token]);

  const hasMore = status === "ready" && page * PAGE_SIZE < total;

  const loadMore = () => {
    if (!token || loadingMore || !hasMore) return;
    const next = page + 1;
    setLoadingMore(true);
    void fetchWalletTransactionPage(HOST, {
      organisationId,
      token,
      pageNo: next,
      perPage: PAGE_SIZE,
    })
      .then((result) => {
        if (!result) {
          setStatus("error");
          return;
        }
        setRows((current) => {
          const seen = new Set(current.map((row) => row.id));
          return current.concat(
            result.transactions.filter((row) => !seen.has(row.id)),
          );
        });
        setTotal(result.total);
        setPage(next);
        setStatus("ready");
      })
      .catch(() => setStatus("error"))
      .finally(() => setLoadingMore(false));
  };

  return (
    <div className="min-h-dvh bg-[#011735] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-white">
      <Link
        to={{ pathname: "/coins", search: location.search }}
        className="inline-flex min-h-11 items-center text-[14px] font-medium text-[#E9E7E9]"
      >
        Back
      </Link>
      <h1 className="mt-4 text-[20px] font-medium text-[#E9E7E9]">
        Coin history
      </h1>

      {!token && (
        <p className="mt-6 text-[14px] leading-5 text-white/70">
          Sign in to see your coin history.
        </p>
      )}

      {token && status === "loading" && (
        <p className="mt-6 text-[14px] leading-5 text-white/70">Loading</p>
      )}

      {token && status === "error" && (
        <p className="mt-6 text-[14px] leading-5 text-white/70">
          Couldn't load coin history. Go back and open it again.
        </p>
      )}

      {token && status === "ready" && rows.length === 0 && (
        <p className="mt-6 text-[14px] leading-5 text-white/70">
          No coin history yet.
        </p>
      )}

      {rows.length > 0 && (
        <ul className="mt-4 flex flex-col">
          {rows.map((transaction) => (
            <li
              key={transaction.id}
              className="flex items-center justify-between gap-3 border-b border-white/10 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-white">
                  {walletTransactionTitle(transaction)}
                </span>
                {transaction.createdAt ? (
                  <span className="mt-0.5 block text-[12px] text-white/55">
                    {transaction.createdAt}
                  </span>
                ) : null}
                {transaction.bonusValue > 0 ? (
                  <span className="mt-0.5 block text-[12px] text-[#FFB020]">
                    +{formatWalletCoins(transaction.bonusValue)} bonus
                  </span>
                ) : null}
              </span>
              <span
                className={`shrink-0 text-[16px] font-semibold ${
                  transaction.transactionType === "debit"
                    ? "text-[#F04444]"
                    : "text-[#5ED86A]"
                }`}
              >
                {signedCoins(transaction)}
              </span>
            </li>
          ))}
        </ul>
      )}

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center text-[14px] font-semibold text-white disabled:opacity-40"
        >
          {loadingMore ? "Loading" : "Load more"}
        </button>
      )}
    </div>
  );
}
