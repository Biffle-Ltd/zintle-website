import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { StoreTopGlow } from "../components/StoreTopGlow";
import { resolvePageAuthToken } from "../utils/authStorage";
import { ZINTLE_BALANCE_COIN_SRC } from "../utils/coinStoreAssets";
import { HOST } from "../utils/host";
import { getOrganisationIdFromSearch } from "../utils/organisationIdFromUrl";
import {
  coinHistoryFilter,
  fetchWalletTransactionPage,
  formatWalletCoins,
  groupHistoryByMonth,
  historyAmountLabel,
  historyDateLabel,
  walletTransactionTitle,
  type CoinHistoryFilter,
  type WalletTransaction,
} from "../utils/walletTransactions";

const PAGE_SIZE = 100;
const FILTERS: { id: CoinHistoryFilter; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "recharge", label: "Recharge" },
  { id: "gift", label: "Gift" },
];

const LABEL_COLOR: Record<string, string> = {
  Debit: "text-[#F04444]",
  Credit: "text-[#3DDC84]",
  Recharge: "text-[#3DDC84]",
  Gift: "text-[#4C8DFF]",
};

export function CoinHistory({
  onBack,
  coinBalance = null,
}: {
  onBack?: () => void;
  coinBalance?: number | null;
}) {
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
  const [filter, setFilter] = useState<CoinHistoryFilter>("chat");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo(0, 0);
  }, [filter]);

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
  const visible = rows.filter((row) => coinHistoryFilter(row) === filter);
  const months = groupHistoryByMonth(visible);

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

  const titleClass =
    "inline-flex items-center gap-1.5 py-1 text-[22px] font-semibold leading-none text-white";

  return (
    <div
      className="relative flex h-dvh flex-col overflow-hidden bg-[#011735] px-4 pt-[55px] text-white"
      style={{ fontFamily: '"Instrument Sans", ui-sans-serif, system-ui, sans-serif' }}
    >
      <StoreTopGlow />
      <header className="relative flex shrink-0 items-center justify-between gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className={titleClass}>
            <BackChevron />
            History
          </button>
        ) : (
          <Link
            to={{ pathname: "/coins", search: location.search }}
            className={titleClass}
          >
            <BackChevron />
            History
          </Link>
        )}
        {coinBalance != null && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/80 py-1 pl-1 pr-2.5"
            aria-label={`${formatWalletCoins(coinBalance)} coins`}
          >
            <img
              src={ZINTLE_BALANCE_COIN_SRC}
              alt=""
              width={96}
              height={96}
              className="h-6 w-6"
              draggable={false}
            />
            <span className="text-[16px] font-semibold leading-5 text-[#E9E7E9]">
              {formatWalletCoins(coinBalance)}
            </span>
          </span>
        )}
      </header>

      <div className="mt-3 flex min-w-0 shrink-0 items-center justify-between gap-2 overflow-x-auto overflow-y-hidden px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((item) => {
          const selected = item.id === filter;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`inline-flex min-h-11 min-w-[96px] shrink-0 items-center justify-center rounded-full px-4 text-[17px] font-medium ${
                selected ? "bg-[#0E2C52] text-white" : "text-white/80"
              }`}
              aria-pressed={selected}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1.5rem,env(safe-area-inset-bottom))] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
      {!token && (
        <p className="mt-8 text-center text-[14px] leading-5 text-white/70">
          Sign in to see your coin history.
        </p>
      )}

      {token && status === "loading" && (
        <p className="mt-8 text-center text-[14px] leading-5 text-white/70">
          Loading
        </p>
      )}

      {token && status === "error" && (
        <p className="mt-8 text-center text-[14px] leading-5 text-white/70">
          Couldn't load coin history. Go back and open it again.
        </p>
      )}

      {token && status === "ready" && visible.length === 0 && !hasMore && (
        <p className="mt-8 text-center text-[14px] leading-5 text-white/70">
          No {filter} history yet.
        </p>
      )}

      {months.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          {months.map((month) => (
            <section
              key={month.label}
              className="rounded-[18px] bg-[#071E3D] px-4 py-3"
            >
              <span className="inline-flex rounded-full bg-[#0E2C52] px-3 py-1 text-[14px] font-medium text-white">
                {month.label}
              </span>
              <ul>
                {month.transactions.map((transaction) => (
                  <HistoryRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            </section>
          ))}
        </div>
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
    </div>
  );
}

function HistoryRow({ transaction }: { transaction: WalletTransaction }) {
  const label = historyAmountLabel(transaction);
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <span className="min-w-0">
        <span className="block truncate text-[18px] font-medium leading-6 text-white">
          {walletTransactionTitle(transaction)}
        </span>
        {transaction.createdAt ? (
          <span className="mt-0.5 block text-[14px] text-[#E0B15A]">
            {historyDateLabel(transaction.createdAt)}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="inline-flex items-center justify-end gap-1">
          <img
            src={ZINTLE_BALANCE_COIN_SRC}
            alt=""
            width={96}
            height={96}
            className="h-5 w-5"
            draggable={false}
          />
          <span className="text-[18px] font-semibold text-white">
            {formatWalletCoins(Math.abs(transaction.value))}
          </span>
        </span>
        <span
          className={`mt-0.5 block text-[14px] font-medium ${LABEL_COLOR[label] ?? "text-white/70"}`}
        >
          {label}
        </span>
      </span>
    </li>
  );
}

function BackChevron() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path
        d="M11 4L6 9l5 5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
